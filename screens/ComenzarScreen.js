import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import AppButton from '../components/AppButton';
import ScreenContainer from '../components/ScreenContainer';
import { fonts, palette, spacing } from '../theme';

export default function ComenzarScreen({ onGoLogin, onGoRegistro }) {
  return (
    <ScreenContainer
      showCard={false}
      contentStyle={styles.content}
    >
      <View style={styles.heroCard}>
        <Image
          source={require('../public/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        {/* <Text style={styles.overline}>Bienvenidos</Text> */}
        <Text style={styles.title}>Comenzar</Text>
        <Text style={styles.body}>
          Importa todas las recetas que quieras, desde Instagram, Facebook, TikTok, Pinterest, Fotos, libros y sitios web.
        </Text>
      </View>

      <View style={styles.actions}>
        <AppButton label="Iniciar sesión" onPress={onGoLogin} />
        <AppButton label="Crear cuenta" onPress={onGoRegistro} variant="secondary" />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
  },
  heroCard: {
    backgroundColor: palette.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE6EC',
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.sm,
  },
  overline: {
    color: palette.button,
    fontFamily: fonts.medium,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  title: {
    color: palette.accent,
    fontFamily: fonts.bold,
    fontSize: 36,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  body: {
    color: palette.text,
    fontFamily: fonts.regular,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.sm,
  },
});
