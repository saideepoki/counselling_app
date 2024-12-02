import { View, Text, TouchableOpacity, FlatList, SafeAreaView, Alert } from 'react-native'
import {
    Calendar,
    Clock,
    CheckCircle2,
    XCircle,
    MoreVertical,
    Filter,
    MessageSquare
  } from 'lucide-react-native';
import React, { useEffect, useState } from 'react'
import { createConversation, fetchUserMeetings } from '@/lib/appwrite';
import { router } from 'expo-router';
import { isWithinScheduledTime, isWithinScheduledTimeSingle } from '@/helper/restrictMeeting';


const formatDate = (dateString : string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    })
};

// Status color and icon mapping
const getStatusStyle = (status : string) => {
    switch(status.toLowerCase()) {
      case 'completed':
        return {
          color: 'text-green-500',
          icon: <CheckCircle2 color="#10B981" size={20} />
        };
      case 'cancelled':
        return {
          color: 'text-red-500',
          icon: <XCircle color="#EF4444" size={20} />
        };
      case 'scheduled':
        return {
          color: 'text-blue-500',
          icon: <Clock color="#3B82F6" size={20} />
        };
      default:
        return {
          color: 'text-gray-500',
          icon: <Clock color="#6B7280" size={20} />
        };
    }
  };

const meetings = () => {
    const[meetings, setMeetings] = useState<any[]>([]);
    const[filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        const loadMeetings = async() => {
            try {
                const fetchedMeetings = await fetchUserMeetings();
                setMeetings(fetchedMeetings || []);
            } catch (error) {
                console.error("Error fetching meetings",error);
            }
        };

        loadMeetings();
    }, []);

    const filteredMeetings = filterStatus === 'all'
    ? meetings
    : meetings.filter(meeting => meeting.status.toLowerCase() === filterStatus);

    const openChat = async(meeting: any) => {
      try {
        if(!isWithinScheduledTimeSingle(meeting)) {
          Alert.alert('Error', 'You can only create a chat during your scheduled meeting time.');
          return;
        }
        const conversationTitle = `${formatDate(meeting.date)} at ${meeting.time}`;
        const conversationId = await createConversation(conversationTitle);
        router.push({
          pathname: '/(tabs)/conversation',
          params: {conversationId, conversationTitle}
        })
      } catch (error) {
        Alert.alert('Error', 'Unable to open chat. Please try again');
      }
    }

    const MeetingItem = ({item} : {item : any}) => {
        const statusStyle = getStatusStyle(item.status);
        return (
            <TouchableOpacity className = 'bg-zinc-800 rounded-lg p-4 mb-4 flex-row items-center'>
                <View className='flex-row items-center flex-1'>
                    <View className = 'mr-4'>
                        <Calendar size={24} color = '#6B7280'/>
                    </View>
                    <View className = 'flex-1'>
                        <Text className = 'text-white font-semibold text-base'>
                            {formatDate(item.date)} at {item.time}
                        </Text>
                        <View className = 'flex-row items-center mt-1'>
                            {statusStyle.icon}
                            <Text className = {`ml-2 ${statusStyle.color}`}>
                                {item.status}
                            </Text>
                        </View>
                    </View>
                </View>
                <TouchableOpacity
                  className = 'p-2'
                  onPress = {() => openChat(item)}
                  disabled={item.status.toLowerCase() !== 'scheduled'}
                >
                    <MessageSquare size = {20} color = '#94A3B8'/>
                    <Text className = 'text-blue-500 text-xs'>Open Chat</Text>
                </TouchableOpacity>
            </TouchableOpacity>
        );
    };

    const FilterButtons = () => {
        const filters = [
          { label: 'All', value: 'all' },
          { label: 'Scheduled', value: 'scheduled' },
          { label: 'Completed', value: 'completed' },
          { label: 'Cancelled', value: 'cancelled' }
        ];

        return (
          <View className="flex-row justify-between mb-4 px-4 mt-2">
            {filters.map((filter) => (
              <TouchableOpacity
                key={filter.value}
                onPress={() => setFilterStatus(filter.value)}
                className={`
                  px-4 py-2 rounded-full
                  ${filterStatus === filter.value
                    ? 'bg-cyan-600'
                    : 'bg-zinc-800'
                  }
                `}
              >
                <Text className={`
                  ${filterStatus === filter.value
                    ? 'text-white'
                    : 'text-zinc-400'
                  }
                `}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      };

  return (
    <SafeAreaView className="flex-1 bg-zinc-900">
      {/* Header */}
      <View className="flex-row justify-between items-center p-4 border-b border-zinc-800">
        <Text className="text-white text-2xl font-bold">Meetings</Text>
        <TouchableOpacity>
          <Filter color="#94A3B8" size={24} />
        </TouchableOpacity>
      </View>

      {/* Filter Buttons */}
      <FilterButtons />

      {/* Meetings List */}
      {filteredMeetings.length > 0 ? (
        <FlatList
          data={filteredMeetings}
          keyExtractor={(item) => item.$id}
          renderItem={({ item }) => <MeetingItem item={item} />}
          ListFooterComponent={<View className="h-20" />}
          className='px-4 pb-4'
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-zinc-400 text-lg">
            No meetings found
          </Text>
        </View>
      )}
    </SafeAreaView>
  )
}

export default meetings