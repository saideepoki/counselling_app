import { View, Text, Alert, Pressable, FlatList } from 'react-native'
import React, { useState } from 'react'
import { getMeetings, scheduleMeeting } from '@/lib/appwrite';
import FormField from './FormField';
import DateTimePicker from '@react-native-community/datetimepicker';
import { PlusCircle } from 'lucide-react-native';

const MeetingScheduler = () => {

    const[meetings, setMeetings] = useState<any[]>([]);
    const[newMeeting, setNewMeeting] = useState({
        email: '',
        date: new Date(),
        time: new Date()
    });
    const[showDatePicker, setShowDatePicker] = useState(false);
    const[showTimePicker, setShowTimePicker] = useState(false);

    const loadMeetings = async() => {
        try {
            const data = await getMeetings() || [];
            setMeetings(data);
        } catch (error) {
            console.error("Error fetching meetings",error);
        }
    }

    const handleSchedule = async () => {
        if(!newMeeting.email) {
            Alert.alert('Error','Please enter a valid email address');
            return;
        }

        try {
            const scheduledMeeting = await scheduleMeeting(
                newMeeting.email,
                newMeeting.date.toISOString().split('T')[0],
                newMeeting.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
            );
            setMeetings((prevMeetings) => [...prevMeetings, scheduledMeeting]);
            Alert.alert('Success', 'Meeting Scheduled Successfully');
            setNewMeeting({
                email: '',
                date: new Date(),
                time: new Date()
            })
        } catch (error) {
            console.error('Error scheduling meeting:', error);
            Alert.alert('Error', 'Failed to schedule meeting.');
        }
    }
  return (
    <View className = 'p-4 bg-zinc-900'>
      <Text className = 'text-xl text-white font-semibold mb-4 mt-4'>Schedule a meeting</Text>

       {/* Email Field */}
      <FormField
        title = 'Email'
        value = {newMeeting.email}
        handleChangeText = {(email : string) => setNewMeeting({...newMeeting, email : email})}
        otherStyles='mt-4'
      />

      {/* Date picker*/}
      <Pressable
        onPress={() => setShowDatePicker(true)}
        className = 'w-full border border-zinc-700 bg-zinc-800 text-white p-3 rounded-lg mb-4 mt-4'
      >
        <Text className = 'text-white'>{newMeeting.date.toDateString()}</Text>
      </Pressable>
      {showDatePicker && (
        <DateTimePicker
            value = {newMeeting.date}
            mode = 'date'
            display='default'
            onChange = {(selectedDate) => {
                setShowDatePicker(false);
                if(selectedDate) {
                    setNewMeeting({...newMeeting, date : new Date(selectedDate.nativeEvent.timestamp)});
                }
            }}
        />
      )}

      {/* Time Picker*/}

      <Pressable
        onPress = {() => setShowTimePicker(true)}
        className = 'w-full border border-zinc-700 bg-zinc-800 text-white p-3 rounded-lg mb-4'
      >
        <Text className = 'text-white'>
            {newMeeting.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </Pressable>
      {showTimePicker && (
        <DateTimePicker
            value = {newMeeting.time}
            mode = 'time'
            display='default'
            onChange={(selectedTime) => {
                setShowTimePicker(false);
                if(selectedTime) {
                    setNewMeeting({...newMeeting, time : new Date(selectedTime.nativeEvent.timestamp)});
                }
            }}
        />
      )}

      {/* Schedule Button*/}
      <Pressable
        onPress = {handleSchedule}
        className = 'flex-row items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-cyan-600 p-3 rounded-lg active:from-cyan-600 active:to-cyan-700'
      >
        <PlusCircle size = {20} color = 'white'/>
        <Text className='text-white font-medium'>Schedule Meeting</Text>
      </Pressable>

      {/* List of meetings*/}
      <FlatList
        data = {meetings}
        keyExtractor={(item) => item.$id}
        renderItem={({item}) => (
            <View className = 'border-b border-zinc-800 p-3'>
            <Text className="text-white">User: {item.user_email}</Text>
            <Text className="text-white">Date: {item.date}</Text>
            <Text className="text-white">Time: {item.time}</Text>
            <Text className="text-white">Status: {item.status}</Text>
            </View>
        )}
        className='mt-4'
      />
    </View>
  )
}

export default MeetingScheduler