import { useState, type ReactNode } from 'react';
import {
  Animated,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { motion } from '../theme';

type Props = PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
  /** Light impact on press — Instant Feel Standard™ */
  haptic?: boolean;
  /** Success notification haptic (e.g. after save) */
  hapticSuccess?: boolean;
};

/** Instant Feel tap acknowledgment — scale + optional haptic within 100ms */
export function InstantFeelPressable({
  style,
  children,
  disabled,
  haptic = true,
  hapticSuccess = false,
  onPressIn,
  onPressOut,
  onPress,
  ...rest
}: Props) {
  const [scale] = useState(() => new Animated.Value(1));

  const pressIn = (e: Parameters<NonNullable<PressableProps['onPressIn']>>[0]) => {
    Animated.timing(scale, {
      toValue: 0.97,
      duration: motion.tap,
      useNativeDriver: true,
    }).start();
    if (haptic && !disabled) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPressIn?.(e);
  };

  const pressOut = (e: Parameters<NonNullable<PressableProps['onPressOut']>>[0]) => {
    Animated.timing(scale, {
      toValue: 1,
      duration: motion.tap,
      useNativeDriver: true,
    }).start();
    onPressOut?.(e);
  };

  const press = (e: Parameters<NonNullable<PressableProps['onPress']>>[0]) => {
    if (hapticSuccess && !disabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onPress?.(e);
  };

  return (
    <Pressable disabled={disabled} onPressIn={pressIn} onPressOut={pressOut} onPress={press} {...rest}>
      <Animated.View style={[style, { transform: [{ scale }] }, disabled ? { opacity: 0.5 } : null]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
