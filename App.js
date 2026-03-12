import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFonts } from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';
import LoginScreen from './screens/LoginScreen';
import ComenzarScreen from './screens/ComenzarScreen';
import RegistroScreen from './screens/RegistroScreen';
import RecuperarContrasenaScreen from './screens/RecuperarContrasenaScreen';
import RestablecerContrasenaScreen from './screens/RestablecerContrasenaScreen';
import PrincipalScreen from './screens/PrincipalScreen';
import SplashScreen from './screens/SplashScreen';
import { palette } from './theme';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const SCREENS = Object.freeze({
  SPLASH: 'Splash',
  COMENZAR: 'Comenzar',
  LOGIN: 'Login',
  REGISTRO: 'Registro',
  RECUPERAR: 'RecuperarContrasena',
  RESTABLECER: 'RestablecerContrasena',
  PRINCIPAL: 'Principal',
});

const DEFAULT_PASSWORD_RECOVERY_REDIRECT_URL = 'https://smd-app-seven.vercel.app';
const STARTER_OFFER_PENDING_EMAIL_KEY = 'smd:trial-offer-pending-email';
const getStarterOfferSeenKey = (userId) => `smd:trial-offer-seen:${userId}`;
const normalizeUserEmail = (value) => String(value || '').trim().toLowerCase();

const getPasswordRecoveryRedirectUrl = () => {
  const configuredRedirectUrl = String(
    process.env.EXPO_PUBLIC_PASSWORD_RECOVERY_REDIRECT_URL || ''
  ).trim();
  if (configuredRedirectUrl) {
    return configuredRedirectUrl;
  }

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const currentOrigin = String(window.location.origin || '').trim();
    const isLocalOrigin =
      currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1');

    if (currentOrigin && !isLocalOrigin) {
      return currentOrigin;
    }
  }

  return DEFAULT_PASSWORD_RECOVERY_REDIRECT_URL;
};

const hasRecoveryTypeInUrl = () => {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return false;
  }

  try {
    const searchParams = new URLSearchParams(window.location.search || '');
    const hashParams = new URLSearchParams(String(window.location.hash || '').replace(/^#/, ''));
    const recoveryType = searchParams.get('type') || hashParams.get('type');
    return recoveryType === 'recovery';
  } catch (_error) {
    return false;
  }
};

const clearAuthHashFromUrl = () => {
  if (
    Platform.OS !== 'web' ||
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof history === 'undefined'
  ) {
    return;
  }

  if (!window.location.hash) {
    return;
  }

  const cleanUrl = `${window.location.pathname}${window.location.search}`;
  window.history.replaceState({}, document.title, cleanUrl);
};

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

export default function App() {
  const isPasswordRecoveryModeRef = useRef(hasRecoveryTypeInUrl());
  const [screen, setScreen] = useState(SCREENS.SPLASH);
  const [session, setSession] = useState(null);
  const [isPasswordRecoveryMode, setIsPasswordRecoveryMode] = useState(
    isPasswordRecoveryModeRef.current
  );
  const [hasFinishedSplash, setHasFinishedSplash] = useState(false);
  const [starterOffer, setStarterOffer] = useState(null);
  const starterOfferCheckInFlightRef = useRef({});
  const starterOfferShownThisSessionRef = useRef({});
  const pendingStarterOfferEmailRef = useRef('');

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
    if (!sessionUser?.id) {
      return;
    }

    const userId = String(sessionUser.id || '');
    if (starterOfferCheckInFlightRef.current[userId] || starterOfferShownThisSessionRef.current[userId]) {
      return;
    }
    starterOfferCheckInFlightRef.current[userId] = true;

    try {
      const normalizedEmail = normalizeUserEmail(sessionUser.email);
      if (!normalizedEmail) {
        return;
      }

      const seenKey = getStarterOfferSeenKey(userId);
      const [seenValue, pendingEmailValue] = await Promise.all([
        AsyncStorage.getItem(seenKey).catch(() => null),
        AsyncStorage.getItem(STARTER_OFFER_PENDING_EMAIL_KEY).catch(() => null),
      ]);
      const pendingEmail = normalizeUserEmail(
        pendingStarterOfferEmailRef.current || pendingEmailValue
      );

      if (seenValue === 'true' || pendingEmail !== normalizedEmail) {
        return;
      }

      starterOfferShownThisSessionRef.current[userId] = true;
      pendingStarterOfferEmailRef.current = '';
      await Promise.all([
        AsyncStorage.setItem(seenKey, 'true').catch(() => null),
        AsyncStorage.removeItem(STARTER_OFFER_PENDING_EMAIL_KEY).catch(() => null),
      ]);

      setStarterOffer({ userId });
    } finally {
      starterOfferCheckInFlightRef.current[userId] = false;
    }
  }, []);

  const handleCloseStarterOffer = useCallback(() => {
    setStarterOffer(null);
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
        maybeOfferStarterRecipes(data.session.user);
      }
      if (hasFinishedSplash && data.session) {
        setScreen(isPasswordRecoveryModeRef.current ? SCREENS.RESTABLECER : SCREENS.PRINCIPAL);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) {
        return;
      }

      const nextIsPasswordRecoveryMode =
        event === 'PASSWORD_RECOVERY' ? true : nextSession ? isPasswordRecoveryModeRef.current : false;

      setSession(nextSession);
      isPasswordRecoveryModeRef.current = nextIsPasswordRecoveryMode;
      setIsPasswordRecoveryMode(nextIsPasswordRecoveryMode);
      supabase.functions.setAuth(nextSession?.access_token || '');
      if (event === 'PASSWORD_RECOVERY') {
        clearAuthHashFromUrl();
      }
      if (nextSession?.user) {
        maybeOfferStarterRecipes(nextSession.user);
      } else {
        starterOfferCheckInFlightRef.current = {};
        starterOfferShownThisSessionRef.current = {};
        pendingStarterOfferEmailRef.current = '';
        setStarterOffer(null);
      }
      if (hasFinishedSplash) {
        if (nextSession && nextIsPasswordRecoveryMode) {
          setScreen(SCREENS.RESTABLECER);
        } else {
          setScreen(nextSession ? SCREENS.PRINCIPAL : SCREENS.COMENZAR);
        }
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

  const handleRegister = async ({ name, email, password, acceptedTerms }) => {
    if (!supabase) {
      return {
        ok: false,
        message: 'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env.',
      };
    }

    if (!acceptedTerms) {
      return {
        ok: false,
        message: 'Debes aceptar los términos y condiciones para crear tu cuenta.',
      };
    }

    const normalizedEmail = normalizeUserEmail(email);
    pendingStarterOfferEmailRef.current = normalizedEmail;
    await AsyncStorage.setItem(STARTER_OFFER_PENDING_EMAIL_KEY, normalizedEmail).catch(() => null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          accepted_terms: true,
          accepted_terms_at: new Date().toISOString(),
        },
      },
    });

    if (error) {
      pendingStarterOfferEmailRef.current = '';
      await AsyncStorage.removeItem(STARTER_OFFER_PENDING_EMAIL_KEY).catch(() => null);
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

  const handlePasswordRecovery = async ({ email }) => {
    if (!supabase) {
      return {
        ok: false,
        message: 'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env.',
      };
    }

    const recoveryOptions = { redirectTo: getPasswordRecoveryRedirectUrl() };

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, recoveryOptions);
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
            : 'No fue posible enviar el enlace de recuperacion por un error inesperado.',
      };
    }

    return {
      ok: true,
      message: 'Si el correo existe, recibirás un enlace para recuperar tu contraseña.',
    };
  };

  const handleResetRecoveredPassword = async ({ password }) => {
    if (!supabase) {
      return {
        ok: false,
        message: 'Configura EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY en .env.',
      };
    }

    try {
      const { error } = await supabase.auth.updateUser({ password });
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
            : 'No fue posible actualizar la contraseña por un error inesperado.',
      };
    }

    return {
      ok: true,
      message: 'Contraseña actualizada. Ahora inicia sesión con tu nueva contraseña.',
    };
  };

  const handleBackToLoginAfterRecovery = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (_signOutError) {
        // no-op
      }
    }
    setSession(null);
    isPasswordRecoveryModeRef.current = false;
    setIsPasswordRecoveryMode(false);
    setScreen(SCREENS.LOGIN);
  };

  const handleLogout = async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (_signOutError) {
        // Si la sesion ya no existe (ej. cuenta eliminada), igual cerramos estado local.
      }
    }
    setSession(null);
    isPasswordRecoveryModeRef.current = false;
    setIsPasswordRecoveryMode(false);
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
            onGoRecuperar={() => navigateTo(SCREENS.RECUPERAR)}
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
      case SCREENS.RECUPERAR:
        return (
          <RecuperarContrasenaScreen
            onSendRecovery={handlePasswordRecovery}
            onBackToLogin={() => navigateTo(SCREENS.LOGIN)}
            onBack={() => navigateTo(SCREENS.COMENZAR)}
            supabaseConfigured={isSupabaseConfigured}
          />
        );
      case SCREENS.RESTABLECER:
        return (
          <RestablecerContrasenaScreen
            onResetPassword={handleResetRecoveredPassword}
            onBackToLogin={handleBackToLoginAfterRecovery}
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
          />
        );
      default:
        return (
          <SplashScreen
            onFinish={() => {
              setHasFinishedSplash(true);
              if (session && isPasswordRecoveryMode) {
                navigateTo(SCREENS.RESTABLECER);
                return;
              }
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
        onRequestClose={handleCloseStarterOffer}
      >
        <View style={styles.starterOverlay}>
          <View style={styles.starterCard}>
            <Text style={styles.starterEyebrow}>Prueba SaveMyDish</Text>
            <Image
              source={require('./public/te-regalamos.png')}
              style={styles.starterHeroImage}
              resizeMode="contain"
            />
            <Pressable style={styles.starterButtonPrimary} onPress={handleCloseStarterOffer}>
              <Text style={styles.starterButtonPrimaryText}>Comenzar gratis</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  starterOverlay: {
    flex: 1,
    backgroundColor: 'rgba(102, 90, 90, 0.78)',
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  starterCard: {
    width: '100%',
    maxWidth: 402,
    backgroundColor: '#F4ECDD',
    borderRadius: 18,
    paddingHorizontal: 36,
    paddingTop: 30,
    paddingBottom: 34,
    alignItems: 'center',
  },
  starterEyebrow: {
    color: palette.text,
    fontFamily: 'Poppins-Medium',
    fontSize: 19,
    lineHeight: 28,
    textAlign: 'center',
    marginBottom: 18,
  },
  starterHeroImage: {
    width: '100%',
    height: 220,
    marginBottom: 30,
  },
  starterButtonPrimary: {
    width: '100%',
    minHeight: 50,
    borderRadius: 10,
    backgroundColor: '#7C97CC',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  starterButtonPrimaryText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
    fontSize: 18,
    lineHeight: 24,
  },
});
