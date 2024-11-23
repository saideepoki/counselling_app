import { View, Text, ScrollView } from 'react-native'
import React from 'react'
import MeetingScheduler from '@/components/MeetingScheduler';

const Dashboard = () => {
  return (
    <ScrollView className="bg-zinc-900 flex-1">
      <MeetingScheduler/>
    </ScrollView>
  )
}

export default Dashboard;