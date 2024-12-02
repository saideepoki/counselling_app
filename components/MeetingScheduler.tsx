import React, { useState, useCallback, useEffect } from 'react'
import { 
  View, 
  Text, 
  Alert, 
  Pressable, 
  FlatList, 
  SafeAreaView, 
  ScrollView 
} from 'react-native'
import { PlusCircle, CalendarPlus, Clock, Mail } from 'lucide-react-native'
import DateTimePicker from '@react-native-community/datetimepicker'

import { getMeetings, scheduleMeeting } from '@/lib/appwrite'
import FormField from './FormField'

const MeetingScheduler: React.FC = () => {
  const [meetings, setMeetings] = useState<any[]>([]);
  const [newMeeting, setNewMeeting] = useState({
    email: '',
    date: new Date(),
    time: new Date()
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        const data = await getMeetings() || [];
        setMeetings(data);
      } catch (error) {
        console.error("Error fetching meetings", error);
        Alert.alert('Error', 'Failed to load meetings');
      }
    };

    loadMeetings();
  }, [])

  const handleSchedule = useCallback(async () => {
    if (!newMeeting.email) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      const scheduledMeeting = await scheduleMeeting(
        newMeeting.email,
        newMeeting.date.toISOString().split('T')[0],
        newMeeting.time.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit', 
          hour12: false 
        })
      );

      setMeetings(prevMeetings => [...prevMeetings, scheduledMeeting]);
      Alert.alert('Success', 'Meeting Scheduled Successfully');
      
      // Reset form
      setNewMeeting({
        email: '',
        date: new Date(),
        time: new Date()
      });
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      Alert.alert('Error', 'Failed to schedule meeting');
    }
  }, [newMeeting]);

  const renderMeetingItem = useCallback(({ item }: { item : any }) => (
    <View className='bg-zinc-800 rounded-lg p-4 mb-3 shadow-md'>
      <View className='flex-row items-center mb-2'>
        <Mail size={16} color='#60a5fa' className='mr-2' />
        <Text className="text-white font-medium">{item.user_email}</Text>
      </View>
      <View className='flex-row items-center mb-2'>
        <CalendarPlus size={16} color='#10b981' className='mr-2' />
        <Text className="text-white">{item.date}</Text>
      </View>
      <View className='flex-row items-center mb-2'>
        <Clock size={16} color='#eab308' className='mr-2' />
        <Text className="text-white">{item.time}</Text>
      </View>
      <View className='self-start px-2 py-1 rounded-full' 
        style={{
          backgroundColor: 
            item.status === 'Confirmed' ? 'rgba(34,197,94,0.2)' :
            item.status === 'Pending' ? 'rgba(234,179,8,0.2)' :
            'rgba(239,68,68,0.2)'
        }}
      >
        <Text 
          className='text-xs font-medium' 
          style={{
            color: 
              item.status === 'Confirmed' ? '#22c55e' :
              item.status === 'Pending' ? '#eab308' :
              '#ef4444'
          }}
        >
          {item.status}
        </Text>
      </View>
    </View>
  ), []);

  return (
    <SafeAreaView className='flex-1 bg-zinc-850'>
      <ScrollView
        className='p-4'
        keyboardShouldPersistTaps='handled'
        showsVerticalScrollIndicator={false}
      >
        <Text className='text-2xl text-white font-bold mb-6 text-center mt-3'>
          Schedule a Meeting
        </Text>

        {/* Email Input */}
        <View className='mb-4'>
        <Text className='text-white mb-2 font-semibold'>Email Address</Text>
          <FormField
            value={newMeeting.email}
            handleChangeText={(email: string) =>
              setNewMeeting(prev => ({ ...prev, email }))
            }
            keyboardType='email-address'
            placeholder='Enter email address'
            otherStyles='bg-zinc-800 border border-zinc-700 rounded-lg'
          />
        </View>

        {/* Date Picker */}
        <View className='mb-4'>
          <Text className='text-white mb-2 font-semibold'>Select Date</Text>
          <Pressable
            onPress={() => setShowDatePicker(true)}
            className='w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg flex-row items-center'
          >
            <CalendarPlus size={20} color='#10b981' className='mr-3' />
            <Text className='text-white flex-1'>
              {newMeeting.date.toLocaleDateString()}
            </Text>
          </Pressable>
          {showDatePicker && (
            <DateTimePicker
              value={newMeeting.date}
              mode='date'
              display='default'
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setNewMeeting(prev => ({ ...prev, date: selectedDate }));
                }
              }}
            />
          )}
        </View>

        {/* Time Picker */}
        <View className='mb-4'>
          <Text className='text-white mb-2 font-semibold'>Select Time</Text>
          <Pressable
            onPress={() => setShowTimePicker(true)}
            className='w-full bg-zinc-800 border border-zinc-700 p-3 rounded-lg flex-row items-center'
          >
            <Clock size={20} color='#eab308' className='mr-3' />
            <Text className='text-white flex-1'>
              {newMeeting.time.toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </Pressable>
          {showTimePicker && (
            <DateTimePicker
              value={newMeeting.time}
              mode='time'
              display='default'
              onChange={(event, selectedTime) => {
                setShowTimePicker(false);
                if (selectedTime) {
                  setNewMeeting(prev => ({ ...prev, time: selectedTime }));
                }
              }}
            />
          )}
        </View>

        {/* Schedule Button */}
        <Pressable
          onPress={handleSchedule}
          className='flex-row items-center justify-center space-x-3 bg-cyan-500 p-4 rounded-lg active:bg-cyan-600 mb-6'
        >
          <PlusCircle size={24} color='white' />
          <Text className='text-white font-bold text-base'>Schedule Meeting</Text>
        </Pressable>

        {/* Meetings List */}
        <Text className='text-xl text-white font-semibold mb-4'>
          Scheduled Meetings
        </Text>
        <FlatList
          data={meetings}
          keyExtractor={(item) => item.$id}
          renderItem={renderMeetingItem}
          ListEmptyComponent={() => (
            <View className='bg-zinc-800 p-6 rounded-lg items-center'>
              <Text className='text-white text-base'>
                No meetings scheduled yet
              </Text>
            </View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

export default MeetingScheduler