import { View, Text, ScrollView, Pressable } from 'react-native'
import React from 'react'
import MeetingScheduler from '@/components/MeetingScheduler';
import { signOut } from '@/lib/appwrite';
import { useGlobalContext } from '@/context/GlobalProvider';
import { router } from 'expo-router';

const scheduleMeetings = () => {

  const {setIsLoggedIn,user, setUser} = useGlobalContext();

  const logout = async() => {
    await signOut();
    setUser(null);
    setIsLoggedIn(false);
    router.replace('/(auth)/signIn');
  }
  return (
    <ScrollView className = 'flex-1 bg-zinc-900 px-4 py-6'>
        <MeetingScheduler/>
    </ScrollView>
  )
}

export default scheduleMeetings;