import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Text, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withDelay,
    runOnJS,
    Easing
} from 'react-native-reanimated';
import { Colors } from '../theme/colors';

const { width } = Dimensions.get('window');
// Create animated component for G or Text
const AnimatedText = Animated.createAnimatedComponent(Text);

export function AnimatedSplash({ onFinish }) {
    const progress = useSharedValue(0);
    const opacity = useSharedValue(1);
    const scale = useSharedValue(0.9);

    // Approximate dashes for text length
    const length = 1000;

    useEffect(() => {
        progress.value = withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) }, (finished) => {
            if (finished) {
                // Scale up slightly and fade out
                scale.value = withTiming(1.1, { duration: 500 });
                opacity.value = withDelay(200, withTiming(0, { duration: 500 }, (f) => {
                    if (f) runOnJS(onFinish)();
                }));
            }
        });
    }, []);

    const animatedProps = useAnimatedProps(() => ({
        strokeDashoffset: length - length * progress.value,
    }));

    const containerStyle = useAnimatedProps(() => ({
        opacity: opacity.value,
        transform: [{ scale: scale.value }]
    }));

    return (
        <Animated.View style={[styles.container, containerStyle]}>
            <Svg height="150" width={width} viewBox="0 0 300 100">
                <Defs>
                    <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor={Colors.primary} stopOpacity="1" />
                        <Stop offset="1" stopColor="#3b82f6" stopOpacity="1" />
                    </LinearGradient>
                </Defs>

                {/* Animated Text "Asimos" */}
                <AnimatedText
                    x="50%"
                    y="65%"
                    textAnchor="middle"
                    fontSize="60"
                    fontWeight="bold"
                    fontFamily="serif" // Simulating handwriting/stylish with serif or if custom font available
                    fill="none" // Empty fill to show only stroke drawing
                    stroke="url(#grad)"
                    strokeWidth="2"
                    strokeDasharray={length}
                    animatedProps={animatedProps}
                >
                    Asimos
                </AnimatedText>

                {/* Fill animation overlay (Optional, maybe fade in fill later? keeping it simple stroke for now as 'handwriting' effect) */}
            </Svg>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F6F7FB', // Match splash bg
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
    },
});
