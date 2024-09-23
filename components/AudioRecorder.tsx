import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import AudioRecord from 'react-native-audio-record';

const AudioRecorder = ({ onAudioSend } : { onAudioSend: any}) => {
  const [recording, setRecording] = useState(false);

  AudioRecord.init({
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    wavFile: 'user_audio.wav',
  });

  const startRecording = () => {
    setRecording(true);
    AudioRecord.start();
  };

  const stopRecording = async () => {
    const audioFile = await AudioRecord.stop();
    setRecording(false);
    onAudioSend(audioFile);  // Send the audio file to parent component (ChatScreen)
  };

  return (
    <View className="w-full">
      <TouchableOpacity
        onPress={recording ? stopRecording : startRecording}
        className={`bg-${recording ? 'red-600' : 'indigo-600'} py-3 px-6 rounded-full shadow-md active:bg-${recording ? 'red-700' : 'indigo-700'} mt-6`}
      >
        <Text className="text-lg font-semibold text-white text-center">
          {recording ? 'Stop Recording' : 'Start Recording'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default AudioRecorder;
