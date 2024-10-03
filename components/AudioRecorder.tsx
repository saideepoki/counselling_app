import React, { useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import AudioRecord from 'react-native-audio-record';
import axios from 'axios';

const AudioRecorder = ({ onAudioSend } : {onAudioSend : any}) => {
  const [recording, setRecording] = useState(false);

  // Initialize Audio Recording
  AudioRecord.init({
    sampleRate: 16000,
    channels: 1,
    bitsPerSample: 16,
    wavFile: 'user_audio.wav',
  });

  // Start recording
  const startRecording = () => {
    setRecording(true);
    AudioRecord.start();
  };

  // Stop recording and upload the file to Cloudinary
  const stopRecording = async () => {
    const audioFile = await AudioRecord.stop();  // This gives you the URI
    setRecording(false);

    // Convert the file URI to a Blob using fetch
    const response = await fetch(audioFile);  // Fetch the file from the URI
    const blob = await response.blob();  // Convert to Blob

    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, 'user_audio.wav');  // Append Blob as file with name

    // Upload the file to Cloudinary
    formData.append('upload_preset', 'your-upload-preset'); // Replace with your Cloudinary upload preset

    try {
      const uploadResponse = await axios.post(
        'https://api.cloudinary.com/v1_1/dywn0gbnk/auto/upload',  // Replace with your Cloudinary URL
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      const audioUrl = uploadResponse.data.secure_url;  // Get the Cloudinary URL
      console.log('Uploaded audio URL:', audioUrl);
      // Send the URL to FastAPI for processing
      onAudioSend(audioUrl);
    } catch (error) {
      console.error('Error uploading audio file:', error);
    }
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
