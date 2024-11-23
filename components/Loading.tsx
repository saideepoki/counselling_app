import React from 'react';
import { View, Text, ActivityIndicator, Modal } from 'react-native';

const LoadingOverlay = ({ visible } : {visible : boolean}) => {
  if (!visible) return null;

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
    >
      <View className="flex-1 bg-black/50 items-center justify-center">
        <View className="bg-zinc-900 p-6 rounded-xl items-center space-y-4 mx-4">
          <ActivityIndicator size="large" color="#0ea5e9" />
          <View className="space-y-2">
            <Text className="text-white text-lg font-medium text-center">
              Processing Audio
            </Text>
            <Text className="text-zinc-400 text-sm text-center">
              Please wait while we analyze your recording
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default LoadingOverlay;