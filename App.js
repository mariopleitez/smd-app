import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import LoginScreen from './screens/LoginScreen';
import ComenzarScreen from './screens/ComenzarScreen';
import RegistroScreen from './screens/RegistroScreen';
import PrincipalScreen from './screens/PrincipalScreen';
import SplashScreen from './screens/SplashScreen';
import { palette } from './theme';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const SCREENS = Object.freeze({
  SPLASH: 'Splash',
  COMENZAR: 'Comenzar',
  LOGIN: 'Login',
  REGISTRO: 'Registro',
  PRINCIPAL: 'Principal',
});

const STARTER_RECIPES_COUNT = 3;

const getStarterRecipesFromBundle = () => {
  try {
    const bundledData = require('./public/recetas.json');
    return Array.isArray(bundledData?.recipes) ? bundledData.recipes : [];
  } catch (_error) {
    return [];
  }
};

const composeStarterRecipeDescription = (description, ingredients) => {
  const baseDescription = String(description || '').trim();
  const cleanIngredients = Array.isArray(ingredients)
    ? ingredients.map((item) => String(item || '').trim()).filter((item) => item.length > 0)
    : [];

  if (!baseDescription && cleanIngredients.length === 0) {
    return '';
  }

  if (cleanIngredients.length === 0) {
    return baseDescription;
  }

  if (!baseDescription) {
    return `Ingredientes: ${cleanIngredients.join(', ')}`;
  }

  return `${baseDescription}\n\nIngredientes: ${cleanIngredients.join(', ')}`;
};

const getStarterLocalImageUrl = (index) => `/receta${index + 1}.png`;
const normalizeStarterSteps = (recipe) => {
  const fromSteps = Array.isArray(recipe?.steps)
    ? recipe.steps.map((step) => String(step || '').trim()).filter((step) => step.length > 0)
    : [];
  if (fromSteps.length > 0) {
    return fromSteps;
  }

  const fromPreparacion = Array.isArray(recipe?.preparacion)
    ? recipe.preparacion.map((step) => String(step || '').trim()).filter((step) => step.length > 0)
    : [];
  if (fromPreparacion.length > 0) {
    return fromPreparacion;
  }

  const rawInstructions = String(recipe?.instructions || '').trim();
  if (rawInstructions.length > 0) {
    return rawInstructions
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  return [];
};

export default function App() {
  const [screen, setScreen] = useState(SCREENS.SPLASH);
  const [session, setSession] = useState(null);
  const [hasFinishedSplash, setHasFinishedSplash] = useState(false);
  const starterSeedInFlightRef = useRef({});

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  const ensureStarterRecipesForUser = useCallback(async (sessionUser) => {
    if (!supabase || !sessionUser?.id) {
      return;
    }

    const userId = sessionUser.id;
    if (starterSeedInFlightRef.current[userId]) {
      return;
    }
    starterSeedInFlightRef.current[userId] = true;

    try {
      const userMetadata = sessionUser.user_metadata || {};
      if (userMetadata.starter_recipes_seeded) {
        return;
      }

      const { count, error: countError } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_user_id', userId);

      if (countError) {
        return;
      }

      if ((count || 0) === 0) {
        const starterRecipes = getStarterRecipesFromBundle().slice(0, STARTER_RECIPES_COUNT);
        const rowsToInsert = starterRecipes
          .map((recipe, index) => {
            const recipeName = String(recipe?.name || '').trim();
            const steps = normalizeStarterSteps(recipe);

            if (!recipeName) {
              return null;
            }

            return {
              owner_user_id: userId,
              name: recipeName,
              description: composeStarterRecipeDescription(recipe?.description, recipe?.ingredients),
              main_photo_url: getStarterLocalImageUrl(index),
              additional_photos: [],
              steps,
              instructions: steps.join('\n'),
              is_public: false,
            };
          })
          .filter((row) => Boolean(row));

        if (rowsToInsert.length > 0) {
          const { error: insertError } = await supabase.from('recipes').insert(rowsToInsert);
          if (insertError) {
            return;
          }
        }
      }

      await supabase.auth.updateUser({
        data: {
          ...userMetadata,
          starter_recipes_seeded: true,
        },
      });
    } finally {
      starterSeedInFlightRef.current[userId] = false;
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    if (!supabase) {
      return () => {
        isMounted = false;
      };
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) {
        return;
      }

      setSession(data.session);
      supabase.functions.setAuth(data.session?.access_token || '');
      if (data.session?.user) {
        ensureStarterRecipesForUser(data.session.user);
      }
      if (hasFinishedSplash && data.session) {
        setScreen(SCREENS.PRINCIPAL);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      supabase.functions.setAuth(nextSession?.access_token || '');
      if (nextSession?.user) {
        ensureStarterRecipesForUser(nextSession.user);
      }
      if (hasFinishedSplash) {
        setScreen(nextSession ? SCREENS.PRINCIPAL : SCREENS.COMENZAR);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [ensureStarterRecipesForUser, hasFinishedSplash]);

  if (!fontsLoaded) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: palette.background }} />;
  }

  const navigateTo = (nextScreen) => {
    if (!nextScreen || nextScreen === screen) {
      return;
    }

    setScreen(nextScreen);
  };

  const handleLogin = async ({ email, password }) => {
    if (!supabase) {
      return {
        ok: false,
        message: 'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env.',
      };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { ok: false, message: error.message };
    }

    return { ok: true };
  };

  const handleRegister = async ({ name, email, password }) => {
    if (!supabase) {
      return {
        ok: false,
        message: 'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env.',
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) {
      return { ok: false, message: error.message };
    }

    if (!data.session) {
      return {
        ok: true,
        message: 'Cuenta creada. Revisa tu correo para confirmar y luego iniciar sesión.',
      };
    }

    return { ok: true };
  };

  const handleLogout = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setScreen(SCREENS.COMENZAR);
  };

  const getScreenComponent = (targetScreen) => {
    switch (targetScreen) {
      case SCREENS.COMENZAR:
        return (
          <ComenzarScreen
            onGoLogin={() => navigateTo(SCREENS.LOGIN)}
            onGoRegistro={() => navigateTo(SCREENS.REGISTRO)}
          />
        );
      case SCREENS.LOGIN:
        return (
          <LoginScreen
            onLogin={handleLogin}
            onGoRegistro={() => navigateTo(SCREENS.REGISTRO)}
            onBack={() => navigateTo(SCREENS.COMENZAR)}
            supabaseConfigured={isSupabaseConfigured}
          />
        );
      case SCREENS.REGISTRO:
        return (
          <RegistroScreen
            onRegister={handleRegister}
            onGoLogin={() => navigateTo(SCREENS.LOGIN)}
            onBack={() => navigateTo(SCREENS.COMENZAR)}
            supabaseConfigured={isSupabaseConfigured}
          />
        );
      case SCREENS.PRINCIPAL:
        return (
          <PrincipalScreen
            onLogout={handleLogout}
            userEmail={session?.user?.email}
            userId={session?.user?.id}
            userName={session?.user?.user_metadata?.full_name}
          />
        );
      default:
        return (
          <SplashScreen
            onFinish={() => {
              setHasFinishedSplash(true);
              navigateTo(session ? SCREENS.PRINCIPAL : SCREENS.COMENZAR);
            }}
          />
        );
    }
  };

  return <SafeAreaView style={{ flex: 1 }}>{getScreenComponent(screen)}</SafeAreaView>;
}
