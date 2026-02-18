import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.49/deno-dom-wasm.ts';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
type Platform = 'web' | 'tiktok' | 'instagram' | 'pinterest';

type RecipeExtraction = {
  name: string;
  description: string;
  ingredients: string[];
  steps: string[];
  instructions: string;
  images: string[];
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_FETCH_TIMEOUT_MS = 15000;

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

async function fetchWithTimeout(
  input: string,
  init: RequestInit = {},
  timeoutMs = DEFAULT_FETCH_TIMEOUT_MS
) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

function normalizeString(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return value.replace(/\s+/g, ' ').trim();
}

function truncate(text: string, max = 12000): string {
  if (text.length <= max) {
    return text;
  }

  return `${text.slice(0, max)}...`;
}

function dedupeStrings(values: string[]): string[] {
  const unique = new Set<string>();
  values.forEach((value) => {
    const normalized = normalizeString(value);
    if (normalized) {
      unique.add(normalized);
    }
  });
  return [...unique];
}

function toAbsoluteHttpUrl(value: string, baseUrl: URL): string {
  const normalized = normalizeString(value);
  if (!normalized) {
    return '';
  }

  try {
    const absolute = new URL(normalized, baseUrl).toString();
    const protocol = new URL(absolute).protocol;
    if (!['http:', 'https:'].includes(protocol)) {
      return '';
    }
    return absolute;
  } catch (_error) {
    return '';
  }
}

function normalizeImageCandidates(values: string[], baseUrl: URL): string[] {
  return dedupeStrings(
    values
      .map((value) => toAbsoluteHttpUrl(value, baseUrl))
      .filter((value) => {
        if (!value) {
          return false;
        }

        const lowered = value.toLowerCase();
        if (lowered.endsWith('.svg')) {
          return false;
        }

        if (
          lowered.includes('/favicon') ||
          lowered.includes('/logo') ||
          lowered.includes('/icon') ||
          lowered.includes('apple-touch-icon')
        ) {
          return false;
        }

        return true;
      })
  );
}

function toStringArray(value: unknown): string[] {
  if (typeof value === 'string') {
    const normalized = normalizeString(value);
    return normalized ? [normalized] : [];
  }

  if (Array.isArray(value)) {
    return dedupeStrings(
      value.flatMap((item) => {
        if (typeof item === 'string') {
          return [item];
        }

        if (item && typeof item === 'object') {
          const typed = item as { url?: unknown; contentUrl?: unknown };
          const url = normalizeString(typed.url ?? typed.contentUrl ?? '');
          return url ? [url] : [];
        }

        return [];
      })
    );
  }

  if (value && typeof value === 'object') {
    const typed = value as { url?: unknown; contentUrl?: unknown };
    const single = normalizeString(typed.url ?? typed.contentUrl ?? '');
    return single ? [single] : [];
  }

  return [];
}

function splitTextToLines(raw: string): string[] {
  return raw
    .split(/\r?\n|•|▪|◦|→|-\s+/)
    .map((line) => normalizeString(line))
    .filter(Boolean);
}

function splitStepsFromText(text: string): string[] {
  return dedupeStrings(
    text
      .split(/\r?\n|\d+\.\s+/)
      .flatMap((chunk) => splitTextToLines(chunk))
      .filter(Boolean)
  );
}

function extractSteps(instructions: unknown): string[] {
  if (!instructions) {
    return [];
  }

  if (typeof instructions === 'string') {
    return splitStepsFromText(instructions);
  }

  if (Array.isArray(instructions)) {
    return dedupeStrings(
      instructions.flatMap((item) => {
        if (typeof item === 'string') {
          return splitStepsFromText(item);
        }

        if (item && typeof item === 'object') {
          const typed = item as { text?: unknown; name?: unknown; itemListElement?: unknown };

          if (typed.itemListElement) {
            return extractSteps(typed.itemListElement);
          }

          const textValue = normalizeString(typed.text ?? typed.name ?? '');
          return textValue ? [textValue] : [];
        }

        return [];
      })
    );
  }

  if (instructions && typeof instructions === 'object') {
    const typed = instructions as { text?: unknown; itemListElement?: unknown };

    if (typed.itemListElement) {
      return extractSteps(typed.itemListElement);
    }

    const single = normalizeString(typed.text ?? '');
    return single ? [single] : [];
  }

  return [];
}

function extractIngredients(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === 'string') {
    return splitTextToLines(value);
  }

  if (Array.isArray(value)) {
    return dedupeStrings(
      value.flatMap((item) => {
        if (typeof item === 'string') {
          return [item];
        }

        if (item && typeof item === 'object') {
          const typed = item as { text?: unknown; name?: unknown };
          const line = normalizeString(typed.text ?? typed.name ?? '');
          return line ? [line] : [];
        }

        return [];
      })
    );
  }

  return [];
}

function isRecipeType(typeValue: unknown): boolean {
  if (typeof typeValue === 'string') {
    return typeValue.toLowerCase() === 'recipe';
  }

  if (Array.isArray(typeValue)) {
    return typeValue.some((item) => typeof item === 'string' && item.toLowerCase() === 'recipe');
  }

  return false;
}

function collectRecipeNodes(node: Json, acc: Record<string, Json>[]) {
  if (!node) {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((child) => collectRecipeNodes(child, acc));
    return;
  }

  if (typeof node !== 'object') {
    return;
  }

  const objectNode = node as Record<string, Json>;
  if (isRecipeType(objectNode['@type'])) {
    acc.push(objectNode);
  }

  Object.values(objectNode).forEach((child) => {
    if (child && (Array.isArray(child) || typeof child === 'object')) {
      collectRecipeNodes(child, acc);
    }
  });
}

function getMetaContent(document: any, selector: string): string {
  return normalizeString(document?.querySelector(selector)?.getAttribute('content') ?? '');
}

function pickLongestText(values: string[]): string {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }

  const sorted = [...values]
    .map((value) => normalizeString(value))
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);

  return sorted[0] ?? '';
}

function getSocialTextCandidates(document: any, platform: Platform): string[] {
  const metaCandidates = dedupeStrings([
    getMetaContent(document, 'meta[property="og:description"]'),
    getMetaContent(document, 'meta[name="description"]'),
    getMetaContent(document, 'meta[name="twitter:description"]'),
    getMetaContent(document, 'meta[property="og:title"]'),
    normalizeString(document?.querySelector('title')?.textContent ?? ''),
  ]);

  if (platform === 'tiktok') {
    return dedupeStrings([
      ...metaCandidates,
      normalizeString(document?.querySelector('[data-e2e="browse-video-desc"]')?.textContent ?? ''),
      normalizeString(document?.querySelector('h1')?.textContent ?? ''),
    ]);
  }

  if (platform === 'instagram') {
    return dedupeStrings([
      ...metaCandidates,
      normalizeString(document?.querySelector('article h1')?.textContent ?? ''),
      normalizeString(document?.querySelector('main h1')?.textContent ?? ''),
    ]);
  }

  if (platform === 'pinterest') {
    return dedupeStrings([
      ...metaCandidates,
      normalizeString(document?.querySelector('h1')?.textContent ?? ''),
    ]);
  }

  return metaCandidates;
}

function getMetaImageCandidates(document: any): string[] {
  const selectors = [
    'meta[property="og:image"]',
    'meta[property="og:image:url"]',
    'meta[property="og:image:secure_url"]',
    'meta[name="twitter:image"]',
    'meta[name="twitter:image:src"]',
    'meta[itemprop="image"]',
    'link[rel="image_src"]',
  ];

  return dedupeStrings(
    selectors.map((selector) => {
      const element = document?.querySelector(selector);
      if (!element) {
        return '';
      }

      if (selector.startsWith('link[')) {
        return normalizeString(element.getAttribute('href') ?? '');
      }

      return normalizeString(element.getAttribute('content') ?? '');
    })
  );
}

function getDomImageCandidates(document: any): string[] {
  const sources: string[] = [];
  const imageNodes = Array.from(document?.querySelectorAll('article img, main img, img') ?? []).slice(0, 20);
  const videoNodes = Array.from(document?.querySelectorAll('video[poster]') ?? []).slice(0, 6);

  imageNodes.forEach((imageNode: any) => {
    const src = normalizeString(
      imageNode?.getAttribute('src') ??
        imageNode?.getAttribute('data-src') ??
        imageNode?.getAttribute('data-lazy-src') ??
        imageNode?.getAttribute('data-original') ??
        ''
    );

    if (src) {
      sources.push(src);
    }
  });

  videoNodes.forEach((videoNode: any) => {
    const poster = normalizeString(videoNode?.getAttribute('poster') ?? '');
    if (poster) {
      sources.push(poster);
    }
  });

  return dedupeStrings(sources);
}

function detectPlatform(url: URL): Platform {
  const host = url.hostname.toLowerCase();

  if (host.includes('tiktok.com')) {
    return 'tiktok';
  }

  if (host.includes('instagram.com')) {
    return 'instagram';
  }

  if (host.includes('pinterest.com') || host.includes('pin.it')) {
    return 'pinterest';
  }

  return 'web';
}

async function fetchOEmbedMetadata(platform: Platform, targetUrl: string) {
  let endpoint = '';

  if (platform === 'tiktok') {
    endpoint = `https://www.tiktok.com/oembed?url=${encodeURIComponent(targetUrl)}`;
  } else if (platform === 'instagram') {
    endpoint = `https://www.instagram.com/oembed/?url=${encodeURIComponent(targetUrl)}`;
  } else if (platform === 'pinterest') {
    endpoint = `https://www.pinterest.com/oembed.json?url=${encodeURIComponent(targetUrl)}`;
  } else {
    return null;
  }

  try {
    const response = await fetchWithTimeout(
      endpoint,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SaveMyDishBot/2.0)',
        },
      },
      10000
    );

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Record<string, unknown>;
    return {
      title: normalizeString(payload.title ?? ''),
      author: normalizeString(payload.author_name ?? ''),
      provider: normalizeString(payload.provider_name ?? ''),
      thumbnailUrl: normalizeString(payload.thumbnail_url ?? ''),
    };
  } catch (_error) {
    return null;
  }
}

function getPlatformNoDataMessage(platform: Platform) {
  if (platform === 'instagram') {
    return 'Instagram no permitió extraer datos automáticamente. Verifica que el reel sea público o usa "Pegar texto".';
  }

  if (platform === 'tiktok') {
    return 'TikTok no permitió extraer datos automáticamente. Verifica que el video sea público o usa "Pegar texto".';
  }

  if (platform === 'pinterest') {
    return 'Pinterest no devolvió datos suficientes. Prueba con otro pin o usa "Pegar texto".';
  }

  return 'No se detectó información suficiente de receta. Prueba con una URL pública o configura OPENAI_API_KEY en la función para extracción avanzada.';
}

function extractRecipeFromDocument(document: any): RecipeExtraction {
  const empty: RecipeExtraction = {
    name: '',
    description: '',
    ingredients: [],
    steps: [],
    instructions: '',
    images: [],
  };

  if (!document) {
    return empty;
  }

  const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'));
  const recipeCandidates: Record<string, Json>[] = [];

  jsonLdScripts.forEach((script: any) => {
    const raw = script.textContent ?? '';
    if (!raw.trim()) {
      return;
    }

    try {
      const parsed = JSON.parse(raw) as Json;
      collectRecipeNodes(parsed, recipeCandidates);
    } catch (_error) {
      // Ignorar JSON-LD inválido.
    }
  });

  const firstRecipe = recipeCandidates[0];

  const ogTitle = getMetaContent(document, 'meta[property="og:title"]');
  const ogDescription = getMetaContent(document, 'meta[property="og:description"]');
  const ogImage = getMetaContent(document, 'meta[property="og:image"]');
  const fallbackTitle = normalizeString(document.querySelector('title')?.textContent ?? '');

  if (!firstRecipe) {
    return {
      ...empty,
      name: ogTitle || fallbackTitle,
      description: ogDescription,
      images: ogImage ? [ogImage] : [],
    };
  }

  const name = normalizeString(firstRecipe.name ?? ogTitle ?? fallbackTitle);
  const description = normalizeString(firstRecipe.description ?? ogDescription);
  const ingredients = extractIngredients(firstRecipe.recipeIngredient ?? firstRecipe.ingredients);
  const steps = extractSteps(firstRecipe.recipeInstructions);
  const instructions = steps.length > 0 ? steps.join('\n') : '';
  const images = toStringArray(firstRecipe.image);

  return {
    name,
    description,
    ingredients,
    steps,
    instructions,
    images: images.length > 0 ? images : (ogImage ? [ogImage] : []),
  };
}

function buildDescription(description: string, ingredients: string[]): string {
  const cleanDescription = normalizeString(description);
  const cleanIngredients = dedupeStrings(ingredients);

  if (cleanDescription && cleanIngredients.length > 0) {
    return `${cleanDescription}\n\nIngredientes: ${cleanIngredients.join(', ')}`;
  }

  if (cleanIngredients.length > 0) {
    return `Ingredientes: ${cleanIngredients.join(', ')}`;
  }

  return cleanDescription;
}

function scoreExtraction(extraction: RecipeExtraction) {
  return (
    (extraction.name ? 4 : 0) +
    Math.min(extraction.ingredients.length, 8) * 2 +
    Math.min(extraction.steps.length, 8) * 2 +
    (extraction.description.length >= 40 ? 2 : extraction.description.length > 0 ? 1 : 0) +
    (extraction.images.length > 0 ? 1 : 0)
  );
}

function normalizeExtraction(input: Partial<RecipeExtraction>): RecipeExtraction {
  const name = normalizeString(input.name ?? '');
  const description = normalizeString(input.description ?? '');
  const ingredients = dedupeStrings(input.ingredients ?? []);
  const steps = dedupeStrings(input.steps ?? []);
  const instructions = normalizeString(input.instructions ?? (steps.length > 0 ? steps.join('\n') : ''));
  const images = dedupeStrings(input.images ?? []);

  return {
    name,
    description,
    ingredients,
    steps,
    instructions,
    images,
  };
}

async function extractRecipeWithOpenAI(params: {
  url: string;
  platform: Platform;
  pageTitle: string;
  pageDescription: string;
  pageTextSnippet: string;
  oEmbedTitle?: string;
  oEmbedAuthor?: string;
  oEmbedProvider?: string;
  oEmbedThumbnailUrl?: string;
}): Promise<RecipeExtraction | null> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    return null;
  }

  const model = Deno.env.get('OPENAI_RECIPE_MODEL') || 'gpt-4.1-mini';

  const systemPrompt =
    'Extrae una receta de cocina desde texto web/social. Devuelve SOLO JSON válido. ' +
    'Si no hay datos suficientes, deja campos vacíos pero siempre devuelve el objeto.';

  const userPrompt = `
URL: ${params.url}
Plataforma: ${params.platform}
Título detectado: ${params.pageTitle}
Descripción detectada: ${params.pageDescription}
oEmbed título: ${params.oEmbedTitle ?? ''}
oEmbed autor: ${params.oEmbedAuthor ?? ''}
oEmbed proveedor: ${params.oEmbedProvider ?? ''}
oEmbed thumbnail: ${params.oEmbedThumbnailUrl ?? ''}

Texto de la página/post:
${params.pageTextSnippet}

Devuelve JSON EXACTAMENTE con este shape:
{
  "name": "string",
  "description": "string",
  "ingredients": ["string"],
  "steps": ["string"],
  "instructions": "string",
  "images": ["string"]
}
`;

  try {
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
      return null;
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as Partial<RecipeExtraction>;
    return normalizeExtraction(parsed);
  } catch (_error) {
    return null;
  }
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

    const body = (await req.json()) as { url?: unknown };
    const rawUrl = normalizeString(body?.url ?? '');

    if (!rawUrl) {
      return jsonResponse({ error: 'URL is required.' }, 400);
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(rawUrl);
    } catch (_error) {
      return jsonResponse({ error: 'Invalid URL.' }, 400);
    }

    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return jsonResponse({ error: 'Only http/https URLs are allowed.' }, 400);
    }

    const platform = detectPlatform(parsedUrl);

    let sourceResponse: Response;
    try {
      sourceResponse = await fetchWithTimeout(
        parsedUrl.toString(),
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SaveMyDishBot/2.0)',
            Accept: 'text/html,application/xhtml+xml',
          },
        },
        15000
      );
    } catch (sourceFetchError) {
      if (sourceFetchError instanceof Error && sourceFetchError.name === 'AbortError') {
        return jsonResponse(
          {
            error:
              'La URL tardó demasiado en responder. Si es Instagram/TikTok, puede bloquear scraping. Prueba con otra URL pública o usa "Pegar texto".',
          },
          504
        );
      }

      return jsonResponse({ error: 'No se pudo descargar la URL para importarla.' }, 400);
    }

    if (!sourceResponse.ok) {
      return jsonResponse({ error: `Could not fetch URL. Status ${sourceResponse.status}.` }, 400);
    }

    const html = await sourceResponse.text();
    const document = new DOMParser().parseFromString(html, 'text/html');
    const structured = extractRecipeFromDocument(document);
    const oEmbed = await fetchOEmbedMetadata(platform, parsedUrl.toString());
    const socialTextCandidates = getSocialTextCandidates(document, platform);
    const socialCaption = pickLongestText([
      ...socialTextCandidates,
      normalizeString(oEmbed?.title ?? ''),
      normalizeString(oEmbed?.author ?? ''),
    ]);
    const metaImages = getMetaImageCandidates(document);
    const domImages = getDomImageCandidates(document);
    const normalizedImagePool = normalizeImageCandidates(
      [
        ...structured.images,
        ...metaImages,
        oEmbed?.thumbnailUrl ?? '',
        ...domImages,
      ],
      parsedUrl
    );

    const enrichedStructured = normalizeExtraction({
      ...structured,
      name: structured.name || oEmbed?.title || '',
      description: structured.description || socialCaption || '',
      images: normalizedImagePool,
    });

    const pageTitle =
      structured.name ||
      normalizeString(document?.querySelector('title')?.textContent ?? '') ||
      oEmbed?.title ||
      '';
    const pageDescription =
      structured.description || socialCaption || getMetaContent(document, 'meta[property="og:description"]') || '';
    const pageTextSnippet = truncate(
      normalizeString(document?.body?.textContent ?? '').slice(0, 12000),
      12000
    );

    const shouldTryAiFallback =
      platform !== 'web' || scoreExtraction(enrichedStructured) < 8;

    let aiExtraction: RecipeExtraction | null = null;
    if (shouldTryAiFallback) {
      aiExtraction = await extractRecipeWithOpenAI({
        url: parsedUrl.toString(),
        platform,
        pageTitle,
        pageDescription,
        pageTextSnippet,
        oEmbedTitle: oEmbed?.title,
        oEmbedAuthor: oEmbed?.author,
        oEmbedProvider: oEmbed?.provider,
        oEmbedThumbnailUrl: oEmbed?.thumbnailUrl,
      });
    }

    const finalExtraction =
      aiExtraction && scoreExtraction(aiExtraction) > scoreExtraction(enrichedStructured)
        ? aiExtraction
        : enrichedStructured;
    const finalImages = normalizeImageCandidates(
      [...finalExtraction.images, ...normalizedImagePool, oEmbed?.thumbnailUrl ?? ''],
      parsedUrl
    );

    if (!finalExtraction.name) {
      return jsonResponse(
        {
          error: getPlatformNoDataMessage(platform),
        },
        422
      );
    }

    const description = buildDescription(finalExtraction.description, finalExtraction.ingredients);
    const mainPhotoUrl = finalImages[0] ?? null;
    const additionalPhotos = finalImages.slice(1, 6);
    const steps = finalExtraction.steps;
    const instructions = finalExtraction.instructions || (steps.length > 0 ? steps.join('\n') : null);

    const { data: insertedRecipe, error: insertError } = await supabase
      .from('recipes')
      .insert({
        owner_user_id: authData.user.id,
        name: finalExtraction.name,
        description,
        main_photo_url: mainPhotoUrl,
        additional_photos: additionalPhotos,
        steps,
        instructions,
        is_public: false,
      })
      .select('id, name, description, main_photo_url, created_at')
      .single();

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 500);
    }

    return jsonResponse({
      success: true,
      recipe: insertedRecipe,
      extraction_source:
        aiExtraction && scoreExtraction(aiExtraction) > scoreExtraction(enrichedStructured)
          ? 'openai_fallback'
          : 'structured',
      platform,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected import error.';
    return jsonResponse({ error: message }, 500);
  }
});
