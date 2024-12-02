import { View, Text, ScrollView, Image, Alert} from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { images } from '@/constants';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { Link, router } from 'expo-router';
import { signIn as signInUser } from '@/lib/appwrite';

const signIn = () => {

  const [form, setForm] = useState({
    email: '',
    password: '',
    passcode: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const submit = async () => {
    if(!form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all the fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const user = await signInUser(form.email, form.password, form.passcode || undefined);
      if(user.role === 'admin') {
        router.replace('/(admin)/scheduleMeetings');
      }
      else {
        router.replace('/(tabs)/conversation');
      }
      // set the result to global state using context
    } catch (error : unknown) {
      Alert.alert('Error', (error as Error).message)
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <SafeAreaView className='bg-zinc-900 h-full'>
      <ScrollView>
        <View className='w-full justify-center min-h-[85vh] px-4 my-6'>
            <Image
              source = {images.logo}
              className='w-48 h-48 rounded-full bg-transparent'
              resizeMode='contain'
              />
              <Text className='text-2xl text-white font-psemibold mt-10'>
                Login to Zoforia AI
              </Text>

            <FormField
              title = "Email"
              value = {form.email}
              handleChangeText = {(e : string) => setForm({...form,
                email: e
              })}
              otherStyles = 'mt-7'
              keyboardType = "email-address"
              />

              <FormField
              title = "Password"
              value = {form.password}
              handleChangeText = {(e : string) => setForm({...form,
                password: e
              })}
              otherStyles = 'mt-7'
              />

              {/* Passcode Field */}
              <FormField
                title="Organization Passcode (Only for First time Admins)"
                value={form.passcode}
                handleChangeText={(e: string) =>
                  setForm({
                    ...form,
                    passcode: e,
                  })
                }
                otherStyles="mt-7"
              />

              <CustomButton
              title='Sign in'
              containerStyles='mt-7'
              handlePress={submit}
              isLoading={isSubmitting}
              />

              <View className='justify-center pt-5 flex-row gap-2'>
                <Text className = "text-lg text-gray-100 font-pregular">Don't have account?</Text>
                <Link
                href='/signUp'
                className='text-lg font-psemibold text-cyan-500'>
                  Sign Up
                </Link>
              </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default signIn