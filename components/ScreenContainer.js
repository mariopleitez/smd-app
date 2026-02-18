import React from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { fonts, palette, spacing } from '../theme';

export function ScreenContainer({
  title,
  subtitle,
  children,
  statusBarStyle = 'dark-content',
  backgroundColor = palette.background,
  showCard = true,
  contentStyle,
  scrollEnabled = true,
}) {
  /**
   * Estructura base reutilizable para todas las pantallas placeholder.
   */
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <ScrollView
        contentContainerStyle={[styles.content, contentStyle]}
        scrollEnabled={scrollEnabled}
      >
        {showCard ? (
          <View style={styles.card}>
            {title ? <Text style={styles.title}>{title}</Text> : null}
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            {children}
          </View>
        ) : (
          children
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: palette.card,
    borderColor: palette.button,
    borderWidth: 1,
    borderRadius: 16,
    padding: spacing.lg,
  },
  title: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 32,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: palette.accent,
    fontFamily: fonts.medium,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
});

export default ScreenContainer;
