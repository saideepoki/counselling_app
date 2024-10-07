import { View, Text, ScrollView, Image, Alert} from 'react-native'
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'
import { images } from '@/constants'
import FormField from '@/components/FormField'
import CustomButton from '@/components/CustomButton'
import { Link, router } from 'expo-router'
import { createUser } from '@/lib/appwrite'

const signUp = () => {

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    if(!form.username || !form.email || !form.password) {
      Alert.alert('Error', 'Please fill in all the fields')
    }

    setIsSubmitting(true);
    try {
      const result = await createUser(form.username, form.email, form.password);
      // set the result to global state using context

      router.replace('/home');
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
                Login to Znoforia AI
              </Text>

              <FormField
              title = "Username"
              value = {form.username}
              handleChangeText={(e : string) => setForm({...form,
                username: e
              })}
              otherStyles='mt-7'/>

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

              <CustomButton
              title='Sign up'
              containerStyles='mt-7'
              handlePress={submit}
              isLoading={isSubmitting}
              />

              <View className='justify-center pt-5 flex-row gap-2'>
                <Text className = "text-lg text-gray-100 font-pregular">Have an account already?</Text>
                <Link
                href='/signIn'
                className='text-lg font-psemibold text-cyan-500'>
                  Sign In
                </Link>
              </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

export default signUp