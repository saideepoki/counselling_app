import { View, Text } from 'react-native';
import React from 'react';
import { Link } from 'expo-router';

export default function HomeScreen() {
  return (
    <View className = "flex-1 justify-center items-center bg-white">
      <Text className='text-3xl'>Counselling App</Text>
      <Link href = "./home">Go to home</Link>
    </View>
  );
}
