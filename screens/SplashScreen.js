import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
      <View style={styles.ringOuter} />
      <View style={styles.ringInner} />
      <View style={styles.centerMark} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringOuter: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    borderWidth: 1,
    borderColor: '#6EA69D',
    opacity: 0.35,
  },
  ringInner: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#9CC9C2',
    opacity: 0.45,
  },
  centerMark: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: '#D9F4EE',
    backgroundColor: 'rgba(217, 244, 238, 0.12)',
  },
});
