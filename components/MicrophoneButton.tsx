import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { Mic, MicOff } from 'lucide-react-native';

interface MicrophoneButtonProps {
  isRecording: boolean;
  onPress: () => void;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ isRecording, onPress }) => {
  return (
    <TouchableOpacity
      className={`p-16 rounded-xl items-center justify-center ${isRecording ? 'bg-cyan-700' : 'bg-cyan-500'}`}
      onPress={onPress}
    >
      {isRecording ? <MicOff color="white" size={24} /> : <Mic color="white" size={24} />}
    </TouchableOpacity>
  );
};


export default MicrophoneButton;