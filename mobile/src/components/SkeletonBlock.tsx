import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type ViewStyle } from 'react-native';
import { colors, motion } from '../theme';

type Props = {
  lines?: number;
  style?: ViewStyle;
};

/** Shimmer skeleton — never show a blank card while data loads */
export function SkeletonBlock({ lines = 3, style }: Props) {
  const [shimmer] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: motion.shimmer, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: motion.shimmer, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0.85] });

  return (
    <View style={[styles.card, style]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {Array.from({ length: lines }, (_, i) => (
        <Animated.View
          key={i}
          style={[styles.line, i === lines - 1 && styles.lineShort, { opacity }]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  line: {
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.border,
  },
  lineShort: {
    width: '72%',
  },
});
