import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { fonts, palette, spacing } from '../theme';

/**
 * Botón simple reutilizable para mantener la interfaz consistente.
 */
export function AppButton({ label, onPress, variant = 'primary', disabled = false }) {
  const isSecondary = variant === 'secondary';

  const buttonStyle = isSecondary
    ? [styles.button, styles.secondaryButton, disabled && styles.buttonDisabled]
    : [styles.button, styles.primaryButton, disabled && styles.buttonDisabled];
  const textStyle = isSecondary ? [styles.text, styles.secondaryText] : [styles.text, styles.primaryText];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} disabled={disabled}>
      <Text style={textStyle}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    alignItems: 'center',
    padding: spacing.md,
    marginTop: spacing.md,
  },
  primaryButton: {
    backgroundColor: palette.button,
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: palette.accent,
    borderWidth: 0,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontFamily: fonts.medium,
    fontWeight: '600',
    fontSize: 16,
  },
  primaryText: {
    color: palette.card,
  },
  secondaryText: {
    color: palette.background,
  },
});

export default AppButton;
