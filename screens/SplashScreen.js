import React, { useEffect } from 'react';
import { Image, StyleSheet } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import { palette } from '../theme';

export default function SplashScreen({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 1600);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <ScreenContainer
      showCard={false}
      backgroundColor={palette.accent}
      statusBarStyle="light-content"
      contentStyle={styles.content}
    >
      <Image
        source={require('../public/logo.png')}
        style={styles.logo}
        resizeMode="contain"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 240,
    height: 240,
  },
});
