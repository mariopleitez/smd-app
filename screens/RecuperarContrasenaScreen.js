import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { fonts, palette, spacing } from '../theme';

export default function RecuperarContrasenaScreen({
  onSendRecovery,
  onBackToLogin,
  onBack,
  supabaseConfigured,
}) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'error' });

  const handleSubmit = async () => {
    const safeEmail = email.trim();
    if (!safeEmail || !safeEmail.includes('@')) {
      setFeedback({ message: 'Ingresa un correo válido.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedback({ message: '', type: 'error' });
    try {
      const result = await onSendRecovery({ email: safeEmail });
      if (!result?.ok) {
        setFeedback({
          message: result?.message || 'No fue posible enviar el correo de recuperación.',
          type: 'error',
        });
        return;
      }

      setFeedback({
        message: result?.message || 'Revisa tu correo para recuperar tu contraseña.',
        type: 'success',
      });
    } catch (unexpectedError) {
      setFeedback({
        message:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : 'No fue posible enviar el correo de recuperación.',
        type: 'error',
      });
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
      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>
        Escribe tu correo y te enviaremos un enlace para restablecerla.
      </Text>
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
      </View>

      {feedback.message ? (
        <Text style={[styles.feedback, feedback.type === 'success' && styles.feedbackSuccess]}>
          {feedback.message}
        </Text>
      ) : null}

      <AppButton
        label={isLoading ? 'Enviando enlace...' : 'Enviar enlace'}
        onPress={handleSubmit}
        disabled={isLoading}
      />
      <AppButton
        label="Volver a Iniciar sesión"
        onPress={onBackToLogin}
        variant="secondary"
        disabled={isLoading}
      />
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
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: palette.mutedText,
    fontFamily: fonts.regular,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
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
