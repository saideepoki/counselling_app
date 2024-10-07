import {TouchableOpacity, Text} from 'react-native'
import React from 'react'

const CustomButton = ({title, handlePress, containerStyles, textStyles, isLoading} : {title : string, handlePress?: any, containerStyles?: any, textStyles?: any, isLoading?: boolean}) => {
  return (
    <TouchableOpacity
    onPress={handlePress}
    activeOpacity={0.7}
    className={`bg-cyan-500 py-4 rounded-full items-center ${containerStyles} ${isLoading ? 'opacity-50' : ''}`}
    disabled = {isLoading}
    >
      <Text className={`font-psemibold text-lg ${textStyles}`}>
        {title}
      </Text>
    </TouchableOpacity>
  )
}

export default CustomButton