import React, { useEffect, useState } from 'react';
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

export default function App() {
  const [screen, setScreen] = useState(SCREENS.SPLASH);
  const [session, setSession] = useState(null);
  const [hasFinishedSplash, setHasFinishedSplash] = useState(false);

  const [fontsLoaded] = useFonts({
    'Poppins-Regular': Poppins_400Regular,
    'Poppins-Medium': Poppins_500Medium,
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
  });

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
      if (hasFinishedSplash && data.session) {
        setScreen(SCREENS.PRINCIPAL);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      if (hasFinishedSplash) {
        setScreen(nextSession ? SCREENS.PRINCIPAL : SCREENS.COMENZAR);
      }
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [hasFinishedSplash]);

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
