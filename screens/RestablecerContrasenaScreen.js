import React, { useState } from 'react';
import { Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { fonts, palette, spacing } from '../theme';

export default function RestablecerContrasenaScreen({
  onResetPassword,
  onBackToLogin,
  supabaseConfigured,
}) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'error' });
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    const safePassword = password.trim();
    const safeConfirmPassword = confirmPassword.trim();

    if (!safePassword || !safeConfirmPassword) {
      setFeedback({ message: 'Completa ambos campos de contraseña.', type: 'error' });
      return;
    }

    if (safePassword.length < 6) {
      setFeedback({ message: 'La contraseña debe tener al menos 6 caracteres.', type: 'error' });
      return;
    }

    if (safePassword !== safeConfirmPassword) {
      setFeedback({ message: 'Las contraseñas no coinciden.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setFeedback({ message: '', type: 'error' });
    try {
      const result = await onResetPassword({ password: safePassword });
      if (!result?.ok) {
        setFeedback({
          message: result?.message || 'No fue posible actualizar tu contraseña.',
          type: 'error',
        });
        setIsSuccess(false);
        return;
      }

      setFeedback({
        message: result?.message || 'Contraseña actualizada. Ahora puedes iniciar sesión.',
        type: 'success',
      });
      setIsSuccess(true);
      setPassword('');
      setConfirmPassword('');
    } catch (unexpectedError) {
      setFeedback({
        message:
          unexpectedError instanceof Error
            ? unexpectedError.message
            : 'No fue posible actualizar tu contraseña.',
        type: 'error',
      });
      setIsSuccess(false);
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
      <Text style={styles.title}>Restablecer contraseña</Text>
      {!supabaseConfigured ? (
        <Text style={styles.warning}>
          Supabase no está configurado. Agrega `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY` en `.env`.
        </Text>
      ) : null}

      <View style={styles.formCard}>
        <Text style={styles.label}>Nueva contraseña</Text>
        <View style={styles.passwordField}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            secureTextEntry={!showPassword}
            textContentType="newPassword"
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

        <Text style={styles.label}>Confirmar contraseña</Text>
        <View style={styles.passwordField}>
          <TextInput
            style={[styles.input, styles.passwordInput]}
            secureTextEntry={!showConfirmPassword}
            textContentType="newPassword"
            placeholder="********"
            placeholderTextColor={palette.mutedText}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword((current) => !current)}
            style={styles.passwordToggle}
            accessibilityRole="button"
            accessibilityLabel={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Ionicons
              name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={palette.mutedText}
            />
          </TouchableOpacity>
        </View>
      </View>

      {feedback.message ? (
        <Text style={[styles.feedback, feedback.type === 'success' && styles.feedbackSuccess]}>
          {feedback.message}
        </Text>
      ) : null}

      {isSuccess ? (
        <AppButton label="Ir a Iniciar sesión" onPress={onBackToLogin} variant="secondary" />
      ) : (
        <AppButton
          label={isLoading ? 'Actualizando...' : 'Actualizar contraseña'}
          onPress={handleSubmit}
          disabled={isLoading}
        />
      )}
      <AppButton label="Volver a Iniciar sesión" onPress={onBackToLogin} variant="ghost" disabled={isLoading} />
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
