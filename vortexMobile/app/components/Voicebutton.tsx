import { useEffect, useRef } from "react";
import { TouchableOpacity, StyleSheet, Animated, View } from "react-native";
import { theme } from "./theme";

interface VoiceButtonProps {
  recording: boolean;
  processing: boolean;
  onPress: () => void;
  size?: number;
}

export function VoiceButton({
  recording,
  processing,
  onPress,
  size = 80,
}: VoiceButtonProps) {
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse3 = useRef(new Animated.Value(1)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(1)).current;

  // Staggered pulse rings while recording
  useEffect(() => {
    if (!recording) {
      pulse1.setValue(1);
      pulse2.setValue(1);
      pulse3.setValue(1);
      iconScale.setValue(1);
      return;
    }

    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1.9,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );

    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(iconScale, {
          toValue: 1.1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
    );

    const a1 = makePulse(pulse1, 0);
    const a2 = makePulse(pulse2, 330);
    const a3 = makePulse(pulse3, 660);

    a1.start();
    a2.start();
    a3.start();
    breathe.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
      breathe.stop();
      pulse1.setValue(1);
      pulse2.setValue(1);
      pulse3.setValue(1);
      iconScale.setValue(1);
    };
  }, [recording]);

  // Spinning arc while processing
  useEffect(() => {
    if (!processing) {
      spin.setValue(0);
      return;
    }

    const anim = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    );
    anim.start();

    return () => {
      anim.stop();
      spin.setValue(0);
    };
  }, [processing]);

  const spinDeg = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const bgColor = processing ? theme.bg.primary : theme.text.primary;
  const iconColor = processing ? theme.text.primary : "#ffffff";

  return (
    <View style={[styles.wrapper, { width: size * 2.2, height: size * 2.2 }]}>
      {/* Staggered pulse rings — recording only */}
      {recording && (
        <>
          {[pulse1, pulse2, pulse3].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.pulseRing,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  transform: [{ scale: anim }],
                  opacity: anim.interpolate({
                    inputRange: [1, 1.9],
                    outputRange: [0.2, 0],
                  }),
                },
              ]}
            />
          ))}
        </>
      )}

      {/* Spinning arc — processing only */}
      {processing && (
        <Animated.View
          style={[
            styles.spinnerRing,
            {
              width: size + 16,
              height: size + 16,
              borderRadius: (size + 16) / 2,
              transform: [{ rotate: spinDeg }],
            },
          ]}
        />
      )}

      {/* The button */}
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        disabled={processing}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: bgColor,
            borderWidth: processing ? 1.5 : 0,
            borderColor: theme.border.strong,
          },
        ]}
      >
        <Animated.Text
          style={{
            fontSize: size * 0.4,
            color: iconColor,
            transform: [{ scale: iconScale }],
            lineHeight: size * 0.52,
          }}
        >
          {recording ? "■" : processing ? "◌" : "◎"}
        </Animated.Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    backgroundColor: "#37352f",
  },
  spinnerRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "transparent",
    borderTopColor: theme.text.primary,
    borderRightColor: theme.border.default,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
});
