import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ParsedRecipe = {
  isRecipe: boolean;
  reason: string;
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  instructions: string;
};

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

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
}

function uniqueStrings(values: string[]): string[] {
  const unique = new Set<string>();
  values.forEach((value) => {
    const normalized = normalizeString(value);
    if (normalized) {
      unique.add(normalized);
    }
  });
  return [...unique];
}

function parseIngredients(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => String(item ?? '')));
  }

  if (typeof value === 'string') {
    return uniqueStrings(
      value
        .split(/\r?\n|;|,/)
        .map((item) => normalizeString(item))
        .filter((item) => item.length > 0)
    );
  }

  return [];
}

function parseSteps(value: unknown): string[] {
  if (Array.isArray(value)) {
    return uniqueStrings(value.map((item) => String(item ?? '')));
  }

  if (typeof value === 'string') {
    return uniqueStrings(
      value
        .split(/\r?\n|\d+\.\s+|•|▪|◦/)
        .map((item) => normalizeString(item))
        .filter((item) => item.length > 0)
    );
  }

  return [];
}

function buildDescription(description: string, ingredients: string[]): string {
  const cleanDescription = normalizeString(description);
  const cleanIngredients = uniqueStrings(ingredients);

  if (cleanDescription && cleanIngredients.length > 0) {
    return `${cleanDescription}\n\nIngredientes: ${cleanIngredients.join(', ')}`;
  }

  if (cleanIngredients.length > 0) {
    return `Ingredientes: ${cleanIngredients.join(', ')}`;
  }

  return cleanDescription;
}

async function extractRecipeFromText(rawText: string): Promise<ParsedRecipe> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en la Edge Function.');
  }

  const model = Deno.env.get('OPENAI_RECIPE_MODEL') || 'gpt-4.1-mini';

  const systemPrompt =
    'Extrae recetas de texto. Responde SOLO JSON valido. ' +
    'Si el texto no es una receta, marca is_recipe=false y explica reason.';

  const userPrompt = `
Analiza este texto:
${rawText}

Reglas:
1) Si no es receta o faltan datos minimos, responde is_recipe=false.
2) No inventes contenido.
3) Normaliza ingredientes y pasos en listas.

Devuelve EXACTAMENTE este JSON:
{
  "is_recipe": true,
  "reason": "string",
  "name": "string",
  "description": "string",
  "ingredients": ["string"],
  "steps": ["string"],
  "instructions": "string"
}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(rawError || `OpenAI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI no devolvio contenido para procesar el texto.');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch (_parseError) {
    throw new Error('La respuesta de extracción no pudo convertirse a JSON.');
  }

  const steps = parseSteps(parsed.steps);
  const ingredients = parseIngredients(parsed.ingredients);
  const instructions = normalizeString(
    parsed.instructions ?? (steps.length > 0 ? steps.join('\n') : '')
  );

  return {
    isRecipe: Boolean(parsed.is_recipe),
    reason: normalizeString(parsed.reason),
    name: normalizeString(parsed.name),
    description: normalizeString(parsed.description),
    ingredients,
    steps,
    instructions,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header.' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    if (!supabaseUrl || !supabaseAnonKey) {
      return jsonResponse({ error: 'Supabase env vars are missing in Edge Function.' }, 500);
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return jsonResponse({ error: 'Unauthorized request.' }, 401);
    }

    const body = (await req.json()) as { text?: unknown };
    const rawText = String(body.text ?? '').trim();

    if (!rawText) {
      return jsonResponse({ error: 'El texto de receta es obligatorio.' }, 400);
    }

    if (rawText.length < 20) {
      return jsonResponse({ error: 'El texto es demasiado corto para detectar una receta.' }, 422);
    }

    const extraction = await extractRecipeFromText(rawText);
    const hasCoreData = extraction.name && (extraction.ingredients.length > 0 || extraction.steps.length > 0);
    if (!extraction.isRecipe || !hasCoreData) {
      return jsonResponse(
        {
          error: extraction.reason || 'No se detectó una receta válida en el texto.',
        },
        422
      );
    }

    const description = buildDescription(extraction.description, extraction.ingredients);
    const steps = extraction.steps;
    const instructions = extraction.instructions || (steps.length > 0 ? steps.join('\n') : null);

    const { data: insertedRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        owner_user_id: authData.user.id,
        name: extraction.name,
        description,
        main_photo_url: null,
        additional_photos: [],
        steps,
        instructions,
        is_public: false,
      })
      .select('id, owner_user_id, name, description, main_photo_url, steps, instructions, is_public, created_at')
      .single();

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }

    return jsonResponse({
      success: true,
      recipe: insertedRecipe,
      extraction_source: 'text_ocr',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected text import error.';
    return jsonResponse({ error: message }, 500);
  }
});
