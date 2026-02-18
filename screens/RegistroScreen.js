import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { fonts, palette, spacing } from '../theme';

export default function RegistroScreen({ onRegister, onGoLogin, onBack, supabaseConfigured }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ message: '', type: 'error' });

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

    setIsLoading(true);
    setFeedback({ message: '', type: 'error' });
    const result = await onRegister({ name: safeName, email: safeEmail, password });
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
      <Text style={styles.overline}>Placeholder de Autenticacion</Text>
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
        <TextInput
          style={styles.input}
          secureTextEntry
          placeholder="********"
          placeholderTextColor={palette.mutedText}
          value={password}
          onChangeText={setPassword}
        />
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
