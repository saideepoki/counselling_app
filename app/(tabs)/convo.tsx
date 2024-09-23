import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import AudioRecorder from '../../components/AudioRecorder';

const Convo = () => {
    const [responseText, setResponseText] = useState('');

    const handleAudioSend = async (audioFile: string) => {
    //   const response = await sendAudioToBackend(audioFile);
    //   setResponseText(response.text);  // Display chatbot response
    //   playChatbotResponse(response.audioUrl);  // Play the audio response
    console.log("TODO");
    };
  
    return (
      <View className="flex-1 justify-center items-center bg-white p-6">
        <View className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm shadow-xl">
          <Text className="text-2xl font-bold text-gray-100 text-center mb-4">
            Chat with Your Personal Counselor
          </Text>
          <Text className="text-md text-gray-300 text-center mb-8">
            Start the conversation by sending a voice message.
          </Text>
          
          <AudioRecorder onAudioSend={handleAudioSend} />
          
          {responseText && (
            <View className="bg-gray-800 p-4 rounded-lg mt-4">
              <Text className="text-gray-200 text-center">Bot Response:</Text>
              <Text className="text-gray-100 text-center mt-2">{responseText}</Text>
            </View>
          )}
  
          <TouchableOpacity className="bg-indigo-600 py-3 px-6 rounded-full shadow-md active:bg-indigo-700 mt-6">
            <Text className="text-lg font-semibold text-white text-center">
              Send Another Message
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
}

export default Convo;