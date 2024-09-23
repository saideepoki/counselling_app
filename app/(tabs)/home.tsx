import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';

const Home = () => {
  return (
    <View className="flex-1 justify-center items-center bg-white p-6">
      <View className="bg-gray-900 rounded-3xl p-8 w-full max-w-sm shadow-xl">
        <Text className="text-2xl font-bold text-gray-100 text-center mb-4">
          Your Personal Counseling Assistant
        </Text>
        <Text className="text-md text-gray-300 text-center mb-8">
          Get support and guidance anytime, anywhere.
        </Text>
        <Link href="./convo" asChild>
          <TouchableOpacity className="bg-indigo-600 py-3 px-6 rounded-full shadow-md active:bg-indigo-700">
            <Text className="text-lg font-semibold text-white text-center">
              Start Chatting
            </Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );
};

export default Home;