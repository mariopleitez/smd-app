import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { fonts, palette, spacing } from '../theme';

export default function LoginScreen({
  onLogin,
  onGoRegistro,
  onGoRecuperar,
  onBack,
  supabaseConfigured,
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const handleSubmit = async () => {
    const safeEmail = email.trim();
    if (!safeEmail || !password) {
      setFeedback('Completa correo y contraseña.');
      return;
    }

    setIsLoading(true);
    setFeedback('');
    try {
      const result = await onLogin({ email: safeEmail, password });
      if (!result?.ok) {
        setFeedback(result?.message || 'No fue posible iniciar sesión.');
      }
    } catch (unexpectedError) {
      setFeedback(
        unexpectedError instanceof Error
          ? unexpectedError.message
          : 'No fue posible iniciar sesión.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer showCard={false}>
      <Image
        source={require('../public/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Ingresar</Text>
      {!supabaseConfigured ? (
        <Text style={styles.warning}>
          Supabase no está configurado. Agrega `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env`.
        </Text>
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          placeholder="tu@email.com"
          placeholderTextColor={palette.mutedText}
          autoCapitalize="none"
          textContentType="emailAddress"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordField}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            placeholder="********"
            placeholderTextColor={palette.mutedText}
            secureTextEntry={!showPassword}
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword((current) => !current)}
            style={styles.passwordToggle}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={palette.mutedText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <AppButton
        label={isLoading ? 'Ingresando...' : 'Ingresar'}
        onPress={handleSubmit}
        disabled={isLoading}
      />
      <AppButton
        label="¿Olvidaste tu contraseña?"
        onPress={onGoRecuperar}
        variant="ghost"
        disabled={isLoading}
      />
      <AppButton label="Crear cuenta" onPress={onGoRegistro} variant="secondary" disabled={isLoading} />
      <AppButton label="Volver" onPress={onBack} variant="ghost" disabled={isLoading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 120,
    height: 120,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  formCard: {
    backgroundColor: palette.card,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  warning: {
    color: '#B45309',
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 12,
    padding: spacing.sm,
    marginBottom: spacing.md,
    fontFamily: fonts.regular,
  },
  label: {
    color: palette.text,
    fontFamily: fonts.regular,
    fontSize: 15,
    marginBottom: 8,
    marginTop: 12,
  },
  feedback: {
    color: '#B42318',
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: '#1E4541',
  },
  passwordField: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 44,
  },
  passwordToggle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  title: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 34,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
