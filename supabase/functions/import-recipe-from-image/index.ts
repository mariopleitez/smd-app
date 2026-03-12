import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type ImageSourceType = 'upload' | 'camera';
type InputImage = {
  base64Image: string;
  mimeType: string;
};

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

const MAX_IMAGE_BASE64_CHARS = 8_000_000;
const MAX_IMAGE_COUNT = 5;
const MAX_TOTAL_IMAGE_BASE64_CHARS = 20_000_000;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function errorResponse(params: {
  status: number;
  code: string;
  error: string;
  canReadImage?: boolean;
}) {
  return jsonResponse(
    {
      error: params.error,
      code: params.code,
      can_read_image: Boolean(params.canReadImage),
    },
    params.status
  );
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

function buildNoRecipeMessage(sourceType: ImageSourceType, reason: string, imageCount = 1): string {
  const cleanReason = normalizeString(reason);
  if (cleanReason) {
    return cleanReason;
  }

  if (sourceType === 'camera') {
    return 'La foto tomada no contiene una receta legible. Toma una foto de un libro o pagina de recetas.';
  }

  if (imageCount > 1) {
    return 'Las imagenes seleccionadas no contienen informacion suficiente de receta.';
  }

  return 'La imagen seleccionada no contiene informacion suficiente de receta.';
}

async function extractRecipeFromImages(params: {
  images: InputImage[];
}): Promise<ParsedRecipe> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en la Edge Function.');
  }

  const model = Deno.env.get('OPENAI_RECIPE_MODEL') || 'gpt-4.1-mini';

  const systemPrompt =
    'Extrae recetas de imagenes. Responde SOLO JSON valido. ' +
    'Las imagenes pueden ser varias paginas de una misma receta. Combina la informacion sin inventar nada. ' +
    'Si las imagenes no contienen una receta o no hay datos confiables, marca is_recipe=false y explica reason.';

  const userPrompt = `
Analiza estas imagenes.

Reglas:
1) Las imagenes pertenecen a una misma receta y pueden ser varias paginas consecutivas.
2) Solo extrae receta si el conjunto muestra claramente contenido de receta (ingredientes/pasos/titulo).
3) Si no es receta (ej. objeto, persona, paisaje, texto irrelevante), responde is_recipe=false.
4) Combina informacion entre imagenes cuando una pagina complete a otra.
5) No inventes informacion.

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
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt },
            ...params.images.flatMap((image, index) => [
              { type: 'text', text: `Imagen ${index + 1}` },
              {
                type: 'image_url',
                image_url: { url: `data:${image.mimeType};base64,${image.base64Image}` },
              },
            ]),
          ],
        },
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
    throw new Error('OpenAI no devolvio contenido para procesar la imagen.');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch (_parseError) {
    throw new Error('La respuesta de OCR no pudo convertirse a JSON.');
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

    const body = (await req.json()) as {
      image_base64?: unknown;
      mime_type?: unknown;
      source_type?: unknown;
      images?: unknown;
    };

    const sourceType = (normalizeString(body.source_type).toLowerCase() || 'upload') as ImageSourceType;
    const rawImages = Array.isArray(body.images) ? body.images : [];
    const normalizedImages = (
      rawImages.length > 0
        ? rawImages
        : [
            {
              image_base64: body.image_base64,
              mime_type: body.mime_type,
            },
          ]
    )
      .map((item) => {
        const candidate = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        return {
          base64Image: normalizeString(candidate.image_base64),
          mimeType: normalizeString(candidate.mime_type || 'image/jpeg').toLowerCase(),
        };
      })
      .filter((item) => item.base64Image);

    if (normalizedImages.length === 0) {
      return errorResponse({
        status: 400,
        code: 'IMAGE_BASE64_REQUIRED',
        error: 'Se requiere al menos una imagen.',
        canReadImage: false,
      });
    }

    if (normalizedImages.length > MAX_IMAGE_COUNT) {
      return errorResponse({
        status: 400,
        code: 'TOO_MANY_IMAGES',
        error: `Solo se permiten hasta ${MAX_IMAGE_COUNT} imagenes por importacion.`,
        canReadImage: false,
      });
    }

    const totalBase64Chars = normalizedImages.reduce((sum, image) => sum + image.base64Image.length, 0);
    if (totalBase64Chars > MAX_TOTAL_IMAGE_BASE64_CHARS) {
      return errorResponse({
        status: 413,
        code: 'IMAGE_SET_TOO_LARGE',
        error: 'Las imagenes son demasiado grandes en conjunto. Intenta con fotos mas ligeras.',
        canReadImage: false,
      });
    }

    for (const image of normalizedImages) {
      if (image.base64Image.length > MAX_IMAGE_BASE64_CHARS) {
        return errorResponse({
          status: 413,
          code: 'IMAGE_TOO_LARGE',
          error: 'Una de las imagenes es demasiado grande. Intenta con una foto mas ligera.',
          canReadImage: false,
        });
      }

      if (!image.mimeType.startsWith('image/')) {
        return errorResponse({
          status: 400,
          code: 'IMAGE_INVALID_MIME',
          error: 'Todas las imagenes deben tener un mime_type valido.',
          canReadImage: false,
        });
      }
    }

    const extraction = await extractRecipeFromImages({
      images: normalizedImages,
    });

    const hasCoreData =
      extraction.ingredients.length > 0 || extraction.steps.length > 0 || Boolean(extraction.instructions);
    if (!extraction.isRecipe || !hasCoreData) {
      return errorResponse({
        status: 422,
        code: 'IMAGE_READ_NO_RECIPE',
        error: buildNoRecipeMessage(sourceType, extraction.reason, normalizedImages.length),
        canReadImage: true,
      });
    }

    const recipeName =
      extraction.name ||
      (sourceType === 'camera'
        ? 'Receta importada desde cámara'
        : normalizedImages.length > 1
          ? 'Receta importada desde imagenes'
          : 'Receta importada desde imagen');
    const description = buildDescription(extraction.description, extraction.ingredients);
    const steps = extraction.steps;
    const instructions = extraction.instructions || (steps.length > 0 ? steps.join('\n') : null);

    const { data: insertedRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        owner_user_id: authData.user.id,
        name: recipeName,
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
      return errorResponse({
        status: 500,
        code: 'RECIPE_INSERT_FAILED',
        error: insertError.message,
        canReadImage: true,
      });
    }

    return jsonResponse({
      success: true,
      recipe: insertedRecipe,
      extraction_source: 'image_ocr',
      image_count: normalizedImages.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected image import error.';
    return errorResponse({
      status: 500,
      code: 'IMAGE_PROCESSING_FAILED',
      error: message,
      canReadImage: false,
    });
  }
});
