import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type InputImage = {
  base64Image: string;
  mimeType: string;
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

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim();
}

function compactRecipeText(value: string): string {
  return value
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function extractTextFromImages(params: { images: InputImage[] }): Promise<string> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en la Edge Function.');
  }

  const model = Deno.env.get('OPENAI_RECIPE_MODEL') || 'gpt-4.1-mini';
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
            'Extrae texto de recetas desde imagenes. Responde SOLO JSON valido. ' +
            'Las imagenes pueden ser varias paginas de una misma receta. ' +
            'Transcribe el texto visible en orden, sin inventar nada.',
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Lee todas las imagenes y devuelve exactamente este JSON: {"text":"string"}. ' +
                'El campo text debe contener la transcripcion de la receta en orden de lectura, ' +
                'preservando saltos de linea utiles. Si falta texto en una imagen, usa solo lo visible.',
            },
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
    throw new Error('OpenAI no devolvio contenido para procesar las imagenes.');
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(content) as Record<string, unknown>;
  } catch (_parseError) {
    throw new Error('La respuesta OCR no pudo convertirse a JSON.');
  }

  return compactRecipeText(String(parsed.text ?? ''));
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
      images?: unknown;
    };

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
      return jsonResponse({ error: 'Se requiere al menos una imagen.' }, 400);
    }

    if (normalizedImages.length > MAX_IMAGE_COUNT) {
      return jsonResponse(
        { error: `Solo se permiten hasta ${MAX_IMAGE_COUNT} imagenes por importacion.` },
        400
      );
    }

    const totalBase64Chars = normalizedImages.reduce((sum, image) => sum + image.base64Image.length, 0);
    if (totalBase64Chars > MAX_TOTAL_IMAGE_BASE64_CHARS) {
      return jsonResponse(
        { error: 'Las imagenes son demasiado grandes en conjunto. Intenta con fotos mas ligeras.' },
        413
      );
    }

    for (const image of normalizedImages) {
      if (image.base64Image.length > MAX_IMAGE_BASE64_CHARS) {
        return jsonResponse(
          { error: 'Una de las imagenes es demasiado grande. Intenta con una foto mas ligera.' },
          413
        );
      }

      if (!image.mimeType.startsWith('image/')) {
        return jsonResponse({ error: 'Todas las imagenes deben ser validas.' }, 400);
      }
    }

    const extractedText = await extractTextFromImages({
      images: normalizedImages,
    });

    if (!extractedText) {
      return jsonResponse({ error: 'No se pudo extraer texto legible de las imagenes.' }, 422);
    }

    return jsonResponse({
      success: true,
      text: extractedText,
      image_count: normalizedImages.length,
      extraction_source: 'image_text_ocr',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected image text extraction error.';
    return jsonResponse({ error: message }, 500);
  }
});
