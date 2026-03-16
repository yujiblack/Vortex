import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { theme } from "./theme";

interface Props {
  active?: boolean;
  color?: string;
  height?: number;
}

export function WaveformBar({ active, color, height = 40 }: Props) {
  const BAR_COUNT = 32;
  const anims = useRef(
    Array.from({ length: BAR_COUNT }, () => new Animated.Value(Math.random())),
  ).current;

  useEffect(() => {
    if (!active) return;
    const animations = anims.map((anim) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: Math.random(),
            duration: 300 + Math.random() * 400,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: Math.random() * 0.3,
            duration: 300 + Math.random() * 400,
            useNativeDriver: false,
          }),
        ]),
      ),
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [active]);

  return (
    <View style={[styles.container, { height }]}>
      {anims.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              backgroundColor: color || theme.accent.blue,
              height: anim.interpolate({
                inputRange: [0, 1],
                outputRange: [3, height],
              }),
              opacity: active ? 0.8 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    overflow: "hidden",
  },
  bar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 3,
  },
});
