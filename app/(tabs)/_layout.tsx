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
      name = "home"
      options = {
        {
          title: "Home",
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon
            icon = {icons.home}
            color = {color}
            name = "Home"
            focused = {focused}
            />
          )
        }
      }/>
       <Tabs.Screen
      name = "conversation"
      options = {
        {
          title: "Chat",
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon
            icon = {icons.play}
            color = {color}
            name = "Chat"
            focused = {focused}
            />
          )
        }
      }/>
       <Tabs.Screen
      name = "history"
      options = {
        {
          title: "History",
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon
            icon = {icons.rightArrow}
            color = {color}
            name = "History"
            focused = {focused}
            />
          )
        }
      }/>
       <Tabs.Screen
      name = "report"
      options = {
        {
          title: "Report",
          headerShown: false,
          tabBarIcon: ({color, focused}) => (
            <TabIcon
            icon = {icons.eye}
            color = {color}
            name = "Report"
            focused = {focused}
            />
          )
        }
      }/>
    </Tabs>
   </>
  );
}
