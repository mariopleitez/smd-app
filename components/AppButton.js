import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { fonts, palette, spacing } from '../theme';

/**
 * Botón simple reutilizable para mantener la interfaz consistente.
 */
export function AppButton({ label, onPress, variant = 'primary', disabled = false }) {
  const isSecondary = variant === 'secondary';
  const isGhost = variant === 'ghost';

  const buttonStyle = [
    styles.button,
    isSecondary ? styles.secondaryButton : isGhost ? styles.ghostButton : styles.primaryButton,
    disabled && styles.buttonDisabled,
  ];
  const textStyle = [
    styles.text,
    isSecondary ? styles.secondaryText : isGhost ? styles.ghostText : styles.primaryText,
  ];

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
  ghostButton: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    alignSelf: 'center',
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
  ghostText: {
    color: palette.mutedText,
    fontSize: 14,
    fontFamily: fonts.regular,
    fontWeight: '400',
  },
});

export default AppButton;
