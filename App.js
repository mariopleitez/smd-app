import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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

const isStorageQuotaError = (error) => {
  const errorName = String(error?.name || '').toLowerCase();
  const errorMessage = String(error?.message || '').toLowerCase();
  const errorCode = Number(error?.code);
  return (
    errorName.includes('quota') ||
    errorMessage.includes('quota') ||
    errorCode === 22 ||
    errorCode === 1014
  );
};

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
  const [starterRecipesRefreshToken, setStarterRecipesRefreshToken] = useState(0);
  const [starterOffer, setStarterOffer] = useState(null);
  const [starterOfferFeedback, setStarterOfferFeedback] = useState('');
  const [isAcceptingStarterOffer, setIsAcceptingStarterOffer] = useState(false);
  const starterOfferCheckInFlightRef = useRef({});
  const starterOfferShownThisSessionRef = useRef({});

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      return;
    }

    const viewportContent =
      'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover';
    const viewportMetaTag = document.querySelector('meta[name="viewport"]');
    const previousViewportContent = viewportMetaTag?.getAttribute('content') || '';

    if (viewportMetaTag) {
      viewportMetaTag.setAttribute('content', viewportContent);
    } else {
      const createdViewportMeta = document.createElement('meta');
      createdViewportMeta.setAttribute('name', 'viewport');
      createdViewportMeta.setAttribute('content', viewportContent);
      document.head.appendChild(createdViewportMeta);
    }

    const styleTag = document.createElement('style');
    styleTag.setAttribute('data-smd-ios-zoom-fix', 'true');
    styleTag.textContent = `
      html, body {
        touch-action: manipulation;
        -webkit-text-size-adjust: 100%;
      }
      input, textarea, select {
        font-size: 16px !important;
      }
      a, button, [role="button"] {
        touch-action: manipulation;
      }
    `;
    document.head.appendChild(styleTag);

    return () => {
      styleTag.remove();
      if (viewportMetaTag) {
        viewportMetaTag.setAttribute('content', previousViewportContent);
      }
    };
  }, []);

  const maybeOfferStarterRecipes = useCallback(async (sessionUser) => {
    if (!supabase || !sessionUser?.id) {
      return;
    }

    const userId = sessionUser.id;
    if (starterOfferCheckInFlightRef.current[userId] || starterOfferShownThisSessionRef.current[userId]) {
      return;
    }
    starterOfferCheckInFlightRef.current[userId] = true;

    try {
      const { count, error: countError } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_user_id', userId);

      if (countError) {
        return;
      }

      if ((count || 0) > 0) {
        return;
      }

      const starterRecipes = getStarterRecipesFromBundle()
        .slice(0, STARTER_RECIPES_COUNT)
        .filter((recipe) => String(recipe?.name || '').trim().length > 0);

      if (starterRecipes.length === 0) {
        return;
      }

      starterOfferShownThisSessionRef.current[userId] = true;
      setStarterOffer({
        userId,
        recipes: starterRecipes,
      });
      setStarterOfferFeedback('');
    } finally {
      starterOfferCheckInFlightRef.current[userId] = false;
    }
  }, []);

  const handleAcceptStarterOffer = useCallback(async () => {
    if (!supabase || !starterOffer?.userId || isAcceptingStarterOffer) {
      return;
    }

    setIsAcceptingStarterOffer(true);
    setStarterOfferFeedback('');

    try {
      const userId = starterOffer.userId;
      const { count, error: countError } = await supabase
        .from('recipes')
        .select('id', { count: 'exact', head: true })
        .eq('owner_user_id', userId);

      if (countError) {
        setStarterOfferFeedback('No se pudo validar tus recetas. Intenta nuevamente.');
        return;
      }

      if ((count || 0) > 0) {
        setStarterOffer(null);
        return;
      }

      const rowsToInsert = (starterOffer.recipes || [])
        .slice(0, STARTER_RECIPES_COUNT)
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

      if (rowsToInsert.length === 0) {
        setStarterOffer(null);
        return;
      }

      const { error: insertError } = await supabase.from('recipes').insert(rowsToInsert);
      if (insertError) {
        setStarterOfferFeedback('No se pudieron cargar las recetas de regalo. Intenta nuevamente.');
        return;
      }

      setStarterRecipesRefreshToken((prevToken) => prevToken + 1);
      setStarterOffer(null);
    } finally {
      setIsAcceptingStarterOffer(false);
    }
  }, [isAcceptingStarterOffer, starterOffer]);

  const handleDeclineStarterOffer = useCallback(() => {
    if (isAcceptingStarterOffer) {
      return;
    }

    setStarterOffer(null);
    setStarterOfferFeedback('');
  }, [isAcceptingStarterOffer]);

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
        maybeOfferStarterRecipes(data.session.user);
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
        maybeOfferStarterRecipes(nextSession.user);
      } else {
        starterOfferCheckInFlightRef.current = {};
        starterOfferShownThisSessionRef.current = {};
        setStarterOffer(null);
        setStarterOfferFeedback('');
      }
      if (hasFinishedSplash) {
        setScreen(nextSession ? SCREENS.PRINCIPAL : SCREENS.COMENZAR);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [hasFinishedSplash, maybeOfferStarterRecipes]);

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

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        return { ok: false, message: error.message };
      }
    } catch (unexpectedError) {
      if (isStorageQuotaError(unexpectedError)) {
        return {
          ok: false,
          message: 'El almacenamiento del navegador esta lleno. Limpia los datos del sitio y vuelve a intentar.',
        };
      }
      return {
        ok: false,
        message:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : 'No fue posible iniciar sesion por un error inesperado.',
      };
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
            userAvatar={session?.user?.user_metadata?.avatar_url}
            starterRecipesRefreshToken={starterRecipesRefreshToken}
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

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {getScreenComponent(screen)}
      <Modal
        animationType="fade"
        transparent
        visible={Boolean(starterOffer) && screen === SCREENS.PRINCIPAL}
        onRequestClose={handleDeclineStarterOffer}
      >
        <View style={styles.starterOverlay}>
          <View style={styles.starterCard}>
            <Text style={styles.starterTitle}>Gracias por unirte a la comunidad de SaveMyDish</Text>
            <Text style={styles.starterSubtitle}>
              Queremos regalarte 3 recetas para que comiences tu experiencia:
            </Text>
            <View style={styles.starterList}>
              {(starterOffer?.recipes || []).slice(0, STARTER_RECIPES_COUNT).map((recipe, index) => (
                <View key={`starter-recipe-${index}`} style={styles.starterListItem}>
                  <Text style={styles.starterRecipeName}>
                    {index + 1}. {recipe.name}
                  </Text>
                </View>
              ))}
            </View>
            {Boolean(starterOfferFeedback) && (
              <Text style={styles.starterFeedback}>{starterOfferFeedback}</Text>
            )}
            <View style={styles.starterActions}>
              <Pressable
                style={[styles.starterButton, styles.starterButtonGhost]}
                onPress={handleDeclineStarterOffer}
                disabled={isAcceptingStarterOffer}
              >
                <Text style={styles.starterButtonGhostText}>Ahora no</Text>
              </Pressable>
              <Pressable
                style={[styles.starterButton, styles.starterButtonPrimary, isAcceptingStarterOffer && styles.buttonDisabled]}
                onPress={handleAcceptStarterOffer}
                disabled={isAcceptingStarterOffer}
              >
                {isAcceptingStarterOffer ? (
                  <ActivityIndicator size="small" color={palette.card} />
                ) : (
                  <Text style={styles.starterButtonPrimaryText}>Sí, cargarlas</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  starterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 31, 28, 0.55)',
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  starterCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 22,
    borderWidth: 1,
    borderColor: '#E8DED1',
    gap: 12,
  },
  starterTitle: {
    color: palette.text,
    fontFamily: 'Poppins-Bold',
    fontSize: 19,
    lineHeight: 26,
  },
  starterSubtitle: {
    color: palette.mutedText,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  starterList: {
    gap: 8,
    marginTop: 2,
  },
  starterListItem: {
    backgroundColor: '#F8F2E8',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  starterRecipeName: {
    color: palette.text,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    lineHeight: 20,
  },
  starterFeedback: {
    color: '#A03A3A',
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    lineHeight: 18,
  },
  starterActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  starterButton: {
    flex: 1,
    borderRadius: 12,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  starterButtonGhost: {
    backgroundColor: '#F4EFE5',
    borderWidth: 1,
    borderColor: '#E2D6C3',
  },
  starterButtonGhostText: {
    color: palette.text,
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  starterButtonPrimary: {
    backgroundColor: palette.accent,
  },
  starterButtonPrimaryText: {
    color: palette.card,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.75,
  },
});
