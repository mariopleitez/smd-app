import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_AUDIO_BASE64_CHARS = 12_000_000;

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

function decodeBase64ToBytes(base64: string): Uint8Array {
  const normalized = normalizeString(base64)
    .replace(/^data:[^;]+;base64,/i, '')
    .replace(/\s/g, '');

  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function buildFileNameFromMimeType(mimeType: string): string {
  const cleanMimeType = normalizeString(mimeType).toLowerCase();
  if (cleanMimeType.includes('wav')) {
    return 'dictation.wav';
  }
  if (cleanMimeType.includes('mpeg') || cleanMimeType.includes('mp3')) {
    return 'dictation.mp3';
  }
  if (cleanMimeType.includes('webm')) {
    return 'dictation.webm';
  }
  if (cleanMimeType.includes('caf')) {
    return 'dictation.caf';
  }
  return 'dictation.m4a';
}

async function transcribeAudio(params: { base64Audio: string; mimeType: string }): Promise<string> {
  const openAiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openAiApiKey) {
    throw new Error('OPENAI_API_KEY no esta configurada en la Edge Function.');
  }

  const model = Deno.env.get('OPENAI_TRANSCRIBE_MODEL') || 'whisper-1';
  const bytes = decodeBase64ToBytes(params.base64Audio);
  const audioBlob = new Blob([bytes], { type: params.mimeType || 'audio/mp4' });
  const formData = new FormData();
  formData.append('model', model);
  formData.append('language', 'es');
  formData.append(
    'prompt',
    'Transcribe esta receta en espanol con texto claro, respetando ingredientes, cantidades y pasos.'
  );
  formData.append('file', audioBlob, buildFileNameFromMimeType(params.mimeType));

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const rawError = await response.text();
    throw new Error(rawError || `OpenAI transcription failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as { text?: unknown };
  return normalizeString(payload?.text);
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
      audio_base64?: unknown;
      mime_type?: unknown;
    };

    const audioBase64 = normalizeString(body.audio_base64);
    const mimeType = normalizeString(body.mime_type || 'audio/mp4').toLowerCase();

    if (!audioBase64) {
      return jsonResponse({ error: 'audio_base64 es obligatorio.' }, 400);
    }

    if (audioBase64.length > MAX_AUDIO_BASE64_CHARS) {
      return jsonResponse(
        { error: 'El audio es demasiado grande. Intenta con una grabacion mas corta.' },
        413
      );
    }

    if (!mimeType.startsWith('audio/')) {
      return jsonResponse({ error: 'mime_type debe ser un audio valido.' }, 400);
    }

    const transcript = await transcribeAudio({
      base64Audio: audioBase64,
      mimeType,
    });

    if (!transcript) {
      return jsonResponse({ error: 'No se detecto voz legible en el audio.' }, 422);
    }

    return jsonResponse({
      success: true,
      text: transcript,
      source: 'audio_transcription',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected audio transcription error.';
    return jsonResponse({ error: message }, 500);
  }
});
