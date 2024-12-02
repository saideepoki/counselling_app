import { Tabs } from 'expo-router';
import React from 'react';
import { View, Text, Image } from 'react-native';
import {icons} from '../../constants';


const TabIcon = ({icon, color, name, focused} : {icon : any, color: any, name: any, focused: boolean}) => {
  return (
    <View className='items-center justify-center gap-2'>
      <Image
      source= {icon}
      resizeMode='contain'
      tintColor={color}
      className='w-6 h-6'
      />
      <Text className={`${focused ? 'font-psemibold' : 'font-pregular'} text-xs text-white`}>
        {name}
      </Text>
    </View>
  )
}
export default function TabLayout() {

  return (
    <>
    <Tabs
    screenOptions={{
      tabBarShowLabel: false,
      tabBarStyle: {
        bottom: 2,
        backgroundColor: '#001d3d',
        borderTopColor: '#000814',
        borderTopWidth: 1,
        height: 79
      },
    }}
    >

<Tabs.Screen
      name = 'scheduleMeetings'
      options = {
        {
          title: "scheduleMeetings",
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon
            icon = {icons.upload}
            color = {color}
            name = "Schedule"
            focused = {focused}
            />
          )
        }
      }
      />
      <Tabs.Screen
      name = "profile"
      options = {
        {
          title: "Profile",
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon
            icon = {icons.profile}
            color = {color}
            name = "Profile"
            focused = {focused}
            />
          )
        }
      }/>
    </Tabs>
   </>
  );
}
