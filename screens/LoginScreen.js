import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { fonts, palette, spacing } from '../theme';

export default function LoginScreen({ onLogin, onGoRegistro, onBack, supabaseConfigured }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      <Text style={styles.overline}>Placeholder de Autenticacion</Text>
      <Text style={styles.title}>Ingresar a tu Cuenta</Text>
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
        <TextInput
          style={styles.input}
          placeholder="********"
          placeholderTextColor={palette.mutedText}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
        />
      </View>

      {feedback ? <Text style={styles.feedback}>{feedback}</Text> : null}

      <AppButton
        label={isLoading ? 'Ingresando...' : 'Ingresar'}
        onPress={handleSubmit}
        disabled={isLoading}
      />
      <AppButton label="Crear cuenta" onPress={onGoRegistro} variant="secondary" disabled={isLoading} />
      <AppButton label="Volver" onPress={onBack} disabled={isLoading} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overline: {
    color: palette.button,
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
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
  title: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 34,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
