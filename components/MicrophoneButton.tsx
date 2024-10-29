import React, { useState, useEffect } from 'react';
import { TouchableOpacity, View, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface MicButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

const MicButton: React.FC<MicButtonProps> = ({ isRecording, onPress }) => {
  const [animation] = useState(new Animated.Value(0));

  useEffect(() => {
    if (isRecording) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      animation.setValue(0);
    }
  }, [isRecording]);

  const scale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  return (
    <TouchableOpacity onPress={onPress} className="items-center justify-center">
      <View className="w-20 h-20 rounded-full bg-cyan-300 bg-opacity-30 items-center justify-center">
        <Animated.View 
          className="w-16 h-16 rounded-full bg-cyan-500 items-center justify-center"
          style={{ transform: [{ scale }] }}
        >
          <MaterialCommunityIcons
            name={isRecording ? 'microphone' : 'microphone-outline'}
            size={36}
            color="#fff"
          />
        </Animated.View>
      </View>
      {isRecording && (
        <Animated.View
          className="absolute w-24 h-24 rounded-full border-2 border-cyan-500"
          style={{
            opacity: animation,
          }}
        />
      )}
    </TouchableOpacity>
  );
};

export default MicButton;