import React, { useState } from 'react';
import { Image, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { fonts, palette, spacing } from '../theme';

const TERMS_URL = 'https://landing.savemydish.com';

export default function RegistroScreen({ onRegister, onGoLogin, onBack, supabaseConfigured }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'error' });

  const handleOpenTerms = () => {
    Linking.openURL(TERMS_URL).catch(() => {
      setFeedback({
        message: 'No fue posible abrir los términos y condiciones.',
        type: 'error',
      });
    });
  };

  const handleSubmit = async () => {
    const safeName = name.trim();
    const safeEmail = email.trim();

    if (!safeName || !safeEmail || !password) {
      setFeedback({ message: 'Completa todos los campos para continuar.', type: 'error' });
      return;
    }

    if (password.length < 6) {
      setFeedback({ message: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
      return;
    }

    if (!acceptedTerms) {
      setFeedback({ message: 'Debes aceptar los términos y condiciones para continuar.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedback({ message: '', type: 'error' });
    const result = await onRegister({
      name: safeName,
      email: safeEmail,
      password,
      acceptedTerms,
    });
    setIsLoading(false);

    if (!result.ok) {
      setFeedback({ message: result.message || 'No fue posible crear la cuenta.', type: 'error' });
      return;
    }

    if (result.message) {
      setFeedback({ message: result.message, type: 'success' });
    }
  };

  return (
    <ScreenContainer showCard={false}>
      <Image
        source={require('../public/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>Registro</Text>
      {!supabaseConfigured ? (
        <Text style={styles.warning}>
          Supabase no está configurado. Agrega `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env`.
        </Text>
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Tu nombre"
          placeholderTextColor={palette.mutedText}
          value={name}
          onChangeText={setName}
        />
        <Text style={styles.label}>Correo electrónico</Text>
        <TextInput
          style={styles.input}
          keyboardType="email-address"
          autoCapitalize="none"
          placeholder="tu@email.com"
          placeholderTextColor={palette.mutedText}
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.label}>Contraseña</Text>
        <View style={styles.passwordField}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            secureTextEntry={!showPassword}
            placeholder="********"
            placeholderTextColor={palette.mutedText}
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
        <View style={styles.termsRow}>
          <TouchableOpacity
            onPress={() => setAcceptedTerms((current) => !current)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: acceptedTerms }}
            accessibilityLabel="Aceptar términos y condiciones"
            style={styles.termsCheckbox}
          >
            <Ionicons
              name={acceptedTerms ? 'checkbox' : 'square-outline'}
              size={22}
              color={acceptedTerms ? palette.button : palette.mutedText}
            />
          </TouchableOpacity>
          <Text style={styles.termsText}>
            Acepto los{' '}
            <Text style={styles.termsLink} onPress={handleOpenTerms} accessibilityRole="link">
              términos y condiciones
            </Text>
          </Text>
        </View>
      </View>

      {feedback.message ? (
        <Text style={[styles.feedback, feedback.type === 'success' && styles.feedbackSuccess]}>
          {feedback.message}
        </Text>
      ) : null}

      <AppButton
        label={isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
        onPress={handleSubmit}
        disabled={isLoading}
      />
      <AppButton label="Ya tengo cuenta" onPress={onGoLogin} variant="secondary" disabled={isLoading} />
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
  title: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 34,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderColor: 'transparent',
    borderRadius: 0,
    padding: 0,
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
  input: {
    borderWidth: 1,
    borderColor: '#C6D4E8',
    borderRadius: 12,
    backgroundColor: '#FAFCFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: palette.accent,
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
  termsRow: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  termsCheckbox: {
    marginTop: 1,
  },
  termsText: {
    marginLeft: 10,
    flex: 1,
    color: palette.text,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  termsLink: {
    color: palette.button,
    fontFamily: fonts.medium,
    textDecorationLine: 'underline',
  },
  feedback: {
    color: '#B42318',
    fontFamily: fonts.medium,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  feedbackSuccess: {
    color: '#166534',
  },
});
