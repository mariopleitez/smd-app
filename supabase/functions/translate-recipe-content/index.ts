import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type TranslationMode = 'detect' | 'translate';

type RecipeContent = {
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
};

type DetectionResult = {
  detectedLanguage: string;
  isEnglish: boolean;
};

type TranslationResult = DetectionResult & {
  translated: boolean;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => normalizeString(item))
    .filter((item) => item.length > 0);
}

function normalizeLanguage(value: unknown): string {
  const normalized = normalizeString(value).toLowerCase();
  if (!normalized) {
    return '';
  }

  if (normalized.startsWith('en') || normalized === 'english' || normalized === 'ingles') {
    return 'en';
  }

  if (normalized.startsWith('es') || normalized === 'spanish' || normalized === 'espanol') {
    return 'es';
  }

  return normalized;
}

function parseJsonContent(rawContent: string): Record<string, unknown> {
  const cleaned = String(rawContent || '')
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return JSON.parse(cleaned) as Record<string, unknown>;
}

function buildRecipeContent(body: Record<string, unknown>): RecipeContent {
  return {
    title: normalizeString(body.title),
    description: normalizeString(body.description),
    ingredients: normalizeStringArray(body.ingredients),
    steps: normalizeStringArray(body.steps),
  };
}

function resolveMode(value: unknown): TranslationMode {
  const normalized = normalizeString(value).toLowerCase();
  return normalized === 'translate' ? 'translate' : 'detect';
}

function hasRecipeText(content: RecipeContent): boolean {
  return Boolean(
    content.title ||
      content.description ||
      (Array.isArray(content.ingredients) && content.ingredients.length > 0) ||
      (Array.isArray(content.steps) && content.steps.length > 0)
  );
}

async function detectLanguageWithOpenAi(recipe: RecipeContent): Promise<DetectionResult> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en la Edge Function.');
  }

  const model = Deno.env.get('OPENAI_TRANSLATE_MODEL') || Deno.env.get('OPENAI_RECIPE_MODEL') || 'gpt-4.1-mini';
  const userPrompt = `
Analiza el idioma principal de esta receta.
Devuelve SOLO JSON valido con esta estructura exacta:
{
  "detected_language": "en|es|other",
  "is_english": true
}

Receta:
${JSON.stringify(recipe)}
`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'Eres un detector de idioma para recetas. Responde JSON valido y no agregues texto extra.',
        },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(rawError || `OpenAI language detection failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI no devolvio contenido para detectar idioma.');
  }

  const parsed = parseJsonContent(content);
  const detectedLanguage = normalizeLanguage(parsed.detected_language);
  const isEnglish = Boolean(parsed.is_english) || detectedLanguage === 'en';

  return {
    detectedLanguage: detectedLanguage || (isEnglish ? 'en' : 'other'),
    isEnglish,
  };
}

async function translateRecipeWithOpenAi(
  recipe: RecipeContent,
  targetLanguage: string
): Promise<TranslationResult> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en la Edge Function.');
  }

  const model = Deno.env.get('OPENAI_TRANSLATE_MODEL') || Deno.env.get('OPENAI_RECIPE_MODEL') || 'gpt-4.1-mini';
  const userPrompt = `
Analiza y traduce esta receta.
Reglas:
1) Detecta primero el idioma principal.
2) Solo traduce si el idioma principal es ingles.
3) Si NO es ingles, regresa el contenido original sin cambios y translated=false.
4) Nunca inventes ingredientes ni pasos.
5) Mantén cantidades, unidades y orden.
6) Traduce al idioma destino: ${targetLanguage || 'es'}.

Devuelve SOLO JSON valido con esta estructura exacta:
{
  "detected_language": "en|es|other",
  "is_english": true,
  "translated": true,
  "title": "string",
  "description": "string",
  "ingredients": ["string"],
  "steps": ["string"]
}

Receta:
${JSON.stringify(recipe)}
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
        {
          role: 'system',
          content:
            'Eres traductor experto de recetas. Responde JSON valido y no agregues texto fuera del JSON.',
        },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(rawError || `OpenAI translation failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('OpenAI no devolvio contenido para traducir.');
  }

  const parsed = parseJsonContent(content);
  const detectedLanguage = normalizeLanguage(parsed.detected_language);
  const isEnglish = Boolean(parsed.is_english) || detectedLanguage === 'en';
  const translated = Boolean(parsed.translated) && isEnglish;
  const translatedTitle = normalizeString(parsed.title);
  const translatedDescription = normalizeString(parsed.description);
  const translatedIngredients = normalizeStringArray(parsed.ingredients);
  const translatedSteps = normalizeStringArray(parsed.steps);

  return {
    detectedLanguage: detectedLanguage || (isEnglish ? 'en' : 'other'),
    isEnglish,
    translated,
    title: translatedTitle || recipe.title,
    description: translatedDescription || recipe.description,
    ingredients: translatedIngredients.length > 0 ? translatedIngredients : recipe.ingredients,
    steps: translatedSteps.length > 0 ? translatedSteps : recipe.steps,
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

    const body = (await req.json()) as Record<string, unknown>;
    const mode = resolveMode(body.mode);
    const targetLanguage = normalizeLanguage(body.target_language) || 'es';
    const recipe = buildRecipeContent(body);

    if (!hasRecipeText(recipe)) {
      return jsonResponse({ error: 'No hay contenido suficiente para detectar/traducir.' }, 400);
    }

    if (mode === 'detect') {
      const detection = await detectLanguageWithOpenAi(recipe);
      return jsonResponse({
        success: true,
        mode: 'detect',
        detected_language: detection.detectedLanguage || 'other',
        is_english: detection.isEnglish,
      });
    }

    const translation = await translateRecipeWithOpenAi(recipe, targetLanguage);
    return jsonResponse({
      success: true,
      mode: 'translate',
      detected_language: translation.detectedLanguage || 'other',
      is_english: translation.isEnglish,
      translated: translation.translated,
      title: translation.title,
      description: translation.description,
      ingredients: translation.ingredients,
      steps: translation.steps,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected translation error.';
    return jsonResponse({ error: message }, 500);
  }
});
