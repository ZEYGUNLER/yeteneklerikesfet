import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/theme';

interface ProfileAuraProps {
  level: number;
  children: React.ReactNode;
}

export const ProfileAura: React.FC<ProfileAuraProps> = ({ level, children }) => {
  const { theme } = useTheme();
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (level < 5) return;

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ])
    ).start();
  }, [level]);

  if (level < 5) return <>{children}</>;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const auraColor = level >= 15 ? theme.colors.secondary : theme.colors.primary;

  return (
    <View style={styles.container}>
      <Animated.View style={[
        styles.aura,
        { 
          borderColor: auraColor,
          transform: [{ rotate: spin }, { scale: pulseAnim }],
          opacity: level >= 10 ? 0.6 : 0.3
        }
      ]} />
      {level >= 10 && (
        <Animated.View style={[
          styles.auraInner,
          { 
            borderColor: theme.colors.accent,
            transform: [{ rotate: rotateAnim.interpolate({
              inputRange: [0, 1],
              outputRange: ['360deg', '0deg']
            }) }],
            opacity: 0.4
          }
        ]} />
      )}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  aura: {
    position: 'absolute',
    width: '120%',
    height: '120%',
    borderRadius: 1000,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  auraInner: {
    position: 'absolute',
    width: '110%',
    height: '110%',
    borderRadius: 1000,
    borderWidth: 1,
    borderStyle: 'dotted',
  }
});
