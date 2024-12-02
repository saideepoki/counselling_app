import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native'
import React, { useState } from 'react'
import { icons } from '@/constants';

const FormField = ({title, value, placeholder, handleChangeText, otherStyles, keyboardType, ...props} : {title?: string, value: string, placeholder?: string, handleChangeText: any, otherStyles: string, keyboardType?: string}) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View className={`space-y-2 ${otherStyles}`}>
      {title && (
        <Text className='text-base text-gray-100 font-pmedium'>{title}</Text>
      )}
      <View className = 'w-full h-16 px-4 border-2 border-black-200 bg-zinc-800 rounded-2xl focus:border-cyan-500 items-center flex-row'>
        <TextInput
        className = 'flex-1 text-base text-white font-psemibold'
        value = {value}
        onChangeText={handleChangeText}
        placeholder={placeholder}
        placeholderTextColor='#7b7b8b'
        secureTextEntry = {title === 'Password' && !showPassword}
        />

        {title === 'Password' && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Image
            className='w-6 h-6'
            resizeMode='contain'
            source={icons.eyeHide}/>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default FormField