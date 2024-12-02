import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Alert,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useGlobalContext } from '@/context/GlobalProvider';
import { Feather } from '@expo/vector-icons';
import { signOut, updateUserProfile } from '@/lib/appwrite';
import { router } from 'expo-router';

const ProfileScreen: React.FC = () => {
  const { isLoading, setIsLoggedIn, user, setUser} = useGlobalContext();
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<{ username?: string }>({});

  useEffect(() => {
    if(user) {
      setUsername(user.username);
      setAvatar(user.avatar);
    }
  }, [user]);

  const validateUsername = useCallback(() => {
    if (!username.trim()) {
      setErrors(prev => ({ ...prev, username: 'Username cannot be empty' }));
      return false;
    }
    if (username.length < 3) {
      setErrors(prev => ({ ...prev, username: 'Username must be at least 3 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, username: undefined }));
    return true;
  }, [username]);

  const handleAvatarChange = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Sorry, we need camera roll permissions to make this work.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
      base64: false,
    });

    if (!result.canceled) {
      const selectedAvatar = result.assets[0].uri;
      setAvatar(selectedAvatar);
      setIsEditing(true);
    }
  };

  const updateProfile = async () => {
    if (!validateUsername()) return;

    try {
      setIsEditing(true);
      await updateUserProfile(username, avatar);
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
      setIsEditing(false);
    }
  };

  const logout = async() => {
    await signOut();
    setUser(null);
    setIsLoggedIn(false);
    router.replace('/(auth)/signIn');
  }

  if (!user) {
    return (
      <View className="flex-1 bg-zinc-900 justify-center items-center">
        <Text className="text-white">Loading user data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-zinc-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'center',
            paddingVertical: 24,
            paddingHorizontal: 16
          }}
          keyboardShouldPersistTaps="handled"
          className="bg-zinc-900"
        >
          <View className="bg-zinc-800 rounded-2xl shadow-lg p-6 mx-2">
            {/* Avatar Section */}
            <View className="items-center mb-6">
              <View className="relative">
                <Image
                  source={{ uri: avatar || 'https://via.placeholder.com/150' }}
                  className="w-32 h-32 rounded-full border-4 border-cyan-500"
                  resizeMode="cover"
                />
                <Pressable
                  onPress={handleAvatarChange}
                  className="absolute bottom-0 right-0 bg-cyan-500 p-2 rounded-full"
                >
                  <Feather name="edit-2" size={20} color="white" />
                </Pressable>
              </View>
            </View>

            {/* Profile Form */}
            <View className="space-y-4">
              {/* Username Input */}
              <View>
                <Text className="text-zinc-300 mb-2 font-semibold">Username</Text>
                <View className="flex-row items-center bg-zinc-700 rounded-xl">
                    <View className = 'ml-2'>
                        <Feather
                            name="user"
                            size={20}
                            color={errors.username ? '#EF4444' : '#6B7280'}
                            className="ml-3"
                        />
                    </View>
                  <TextInput
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      setIsEditing(true);
                    }}
                    onBlur={validateUsername}
                    className="flex-1 text-white p-3 rounded-xl"
                    placeholder="Enter your username"
                    placeholderTextColor="#71717A"
                  />
                </View>
                {errors.username && (
                  <Text className="text-red-500 mt-1 text-xs ml-1 flex-row items-center">
                    <Feather name="alert-circle" size={12} className="mr-1" />
                    {errors.username}
                  </Text>
                )}
              </View>

              {/* Email Input */}
              <View>
                <Text className="text-zinc-300 mb-2 font-semibold">Email</Text>
                <View className="flex-row items-center bg-zinc-700 rounded-xl">
                  <View className = 'ml-2'>
                    <Feather 
                        name="mail"
                        size={20}
                        color="#6B7280"
                    />
                  </View>
                  <TextInput
                    value={user?.email ?? ''}
                    editable={false}
                    className="flex-1 text-zinc-400 p-3 rounded-xl"
                  />
                </View>
              </View>

              {/* Save Changes Button */}
              <Pressable
                onPress={updateProfile}
                className={`
                  mt-4 
                  p-4 
                  rounded-lg 
                  flex-row 
                  justify-center 
                  items-center
                  ${isEditing 
                    ? 'bg-cyan-600 hover:bg-cyan-500'
                    : 'bg-cyan-900 rounded-xl'
                  }
                `}
                disabled={!isEditing || isLoading}
              >
                {isLoading ? (
                  <Feather name="loader" size={20} color="white" />
                ) : (
                  <Feather name="save" size={20} color="white" className="mr-2" />
                )}
                <Text className="text-white text-center font-semibold ml-2">
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Text>
              </Pressable>

              <Pressable
                onPress = {logout}
                className="bg-red-700 rounded-xl p-3 mt-4 text-white flex-row items-center justify-center"
              >
                <Text className = 'text-white'>Sign Out</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ProfileScreen;