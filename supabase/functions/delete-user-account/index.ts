import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ success: false, error: 'Missing Authorization header.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceRoleKey) {
      return jsonResponse(
        {
          success: false,
          error: 'Supabase env vars are missing in Edge Function.',
        },
        500
      );
    }

    // Cliente con contexto del usuario para validar identidad del request.
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: authData, error: authError } = await userClient.auth.getUser();
    if (authError || !authData?.user?.id) {
      return jsonResponse({ success: false, error: 'Unauthorized request.' }, 401);
    }

    const userId = authData.user.id;

    // Cliente administrador para borrar datos y cuenta.
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    const deleteTargets: Array<{ table: string; column: string }> = [
      { table: 'shopping_items', column: 'user_id' },
      { table: 'meal_plans', column: 'user_id' },
      { table: 'recipe_user_feedback', column: 'user_id' },
      { table: 'cookbooks', column: 'owner_user_id' },
      { table: 'recipes', column: 'owner_user_id' },
    ];

    for (const target of deleteTargets) {
      const { error: deleteError } = await adminClient
        .from(target.table)
        .delete()
        .eq(target.column, userId);

      if (deleteError) {
        return jsonResponse(
          {
            success: false,
            error: `No se pudo limpiar ${target.table}: ${deleteError.message}`,
          },
          500
        );
      }
    }

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (authDeleteError) {
      return jsonResponse(
        {
          success: false,
          error: `No se pudo eliminar el usuario: ${authDeleteError.message}`,
        },
        500
      );
    }

    return jsonResponse({
      success: true,
      deleted_user_id: userId,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected account deletion error.';
    return jsonResponse({ success: false, error: message }, 500);
  }
});
