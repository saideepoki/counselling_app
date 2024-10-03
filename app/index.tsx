import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { images } from '../constants'; // Assuming images is an object containing image paths

export default function HomeScreen() {
  return (
    <SafeAreaView className="bg-zinc-900 flex-1">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-between px-6 py-5">
          {/* Logo and Text Section */}
          <View className="items-center">
            <Image
              source={images.logo}
              className="w-48 h-48 rounded-full bg-transparent"
              style={{
                borderWidth: 0,
                borderRadius: 50,
                backgroundColor: 'transparent',
              }}
              resizeMode="contain"
            />
            <View className="relative mt-1">
            <Text className="text-3xl font-extrabold mt-8 text-center text-white">
              Welcome to {''}
              <Text className = "text-cyan-500">
              Znoforia AI
            </Text>
            </Text>
            <Image
            source={images.line}
            className='w-[136px] h-[15px] absolute -bottom-2 -right-[0.1]'
            style={{
              tintColor: '#06b6d4', // Cyan-500 color code
            }}
            // resizeMode='contain'
            />
            </View>
            <Text className="text-lg text-center mt-5 text-gray-100">
              Experience the future of intelligent assistance
            </Text>
          </View>

          {/* Card Images Section */}
          <View className="flex-row justify-center items-center mt-12 space-x-0">
            {/* Left Card */}
            <View style={{ transform: [{ rotate: '-5deg' }] }}>
              <Image
                source={images.aiImage} // Replace with your image source
                className="w-40 h-64 rounded-2xl"
                style={{
                  borderRadius: 20,
                  marginRight: -20, // Overlap the two images
                }}
                resizeMode="cover"
              />
            </View>
            {/* Right Card */}
            <View style={{ transform: [{ rotate: '5deg' }] }}>
              <Image
                source={images.welcomeAi} // Replace with your image source
                className="w-40 h-64 rounded-2xl"
                style={{
                  borderRadius: 20,
                  marginLeft: -20, // Overlap the two images
                }}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Buttons Section */}
          <View className="space-y-4 mt-10 mb-10">
            <TouchableOpacity className="bg-cyan-500 py-4 rounded-full items-center">
              <Text className="text-white text-lg font-semibold">Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
