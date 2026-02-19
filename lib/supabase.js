import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const APP_CACHE_KEY_PREFIXES = ['smd:cookbooks:'];

const isQuotaExceededError = (error) => {
  if (!error) {
    return false;
  }

  const errorName = String(error.name || '').toLowerCase();
  const errorMessage = String(error.message || '').toLowerCase();
  const errorCode = Number(error.code);

  return (
    errorName.includes('quota') ||
    errorMessage.includes('quota') ||
    errorCode === 22 ||
    errorCode === 1014
  );
};

const clearAppCacheFromStorage = async () => {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const appCacheKeys = allKeys.filter((key) =>
      APP_CACHE_KEY_PREFIXES.some((prefix) => String(key || '').startsWith(prefix))
    );
    if (appCacheKeys.length > 0) {
      await AsyncStorage.multiRemove(appCacheKeys);
    }
  } catch (_cacheCleanupError) {
    // Si no se puede limpiar cache, evitamos bloquear el flujo de auth.
  }
};

const safeStorage = {
  getItem: async (key) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (_error) {
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      return;
    } catch (error) {
      if (isQuotaExceededError(error)) {
        await clearAppCacheFromStorage();
        try {
          await AsyncStorage.setItem(key, value);
          return;
        } catch (_retryError) {
          // Evita crashes cuando localStorage web llega al limite.
        }
      }
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (_error) {
      // no-op
    }
  },
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: safeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
