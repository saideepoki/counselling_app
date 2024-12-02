import React, { useEffect, useRef, useState } from 'react';
import { View, Button, Alert, FlatList, TouchableOpacity, Text, Pressable, Modal, Animated } from 'react-native';
import { Audio } from 'expo-av';
import MicrophoneButton from '../../components/MicrophoneButton';
import { AndroidAudioEncoder, AndroidOutputFormat, IOSAudioQuality, IOSOutputFormat, Recording } from 'expo-av/build/Audio';
import { createAudio, createConversation, deleteConversation } from '@/lib/appwrite';
import * as FileSystem from 'expo-file-system';
import { fetchAudio, sendAudioToBackend } from '@/lib/backend';
import { PlusCircle, MessageSquare, AppWindow, X, Trash2} from "lucide-react-native";
import { getConversations, getMessages } from '@/lib/appwrite';
import LoadingOverlay from '@/components/Loading';
import { isWithinScheduledTime } from '@/helper/restrictMeeting';
import { useRouter, useLocalSearchParams } from 'expo-router';

const configs = {
  isMeteringEnabled: true,
  android: {
    extension: '.m4a',
    outputFormat: AndroidOutputFormat.MPEG_4,
    audioEncoder: AndroidAudioEncoder.AAC,
    sampleRate: 44000,
    numberOfChannels: 2,
    bitRate: 128000,
  },
  ios: {
    extension: '.m4a',
    outputFormat: IOSOutputFormat.MPEG4AAC,
    audioQuality: IOSAudioQuality.MAX,
    sampleRate: 44000,
    numberOfChannels: 2,
    bitRate: 128000,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: 'audio/webm',
    bitsPerSecond: 128000,
  },
}

const Conversation: React.FC = () => {
  const [recording, setRecording] = useState<Audio.Recording | null>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    audio: null as Recording | null | undefined,
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [llmResponse, setLlmResponse] = useState<string | null>(null);
  const [llmFileURL, setLlmFileURL] = useState<string | null>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [messages,setMessages] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const[isBottomSheetVisible, setIsBottomSheetVisible] = useState<boolean>(false);
  const [sidebarWidth] = useState(new Animated.Value(isSidebarOpen ? 288 : 0));
  const router = useRouter();
  const params = useLocalSearchParams();
  const {conversationId, conversationTitle} = params;


useEffect(() => {
  const fetchConversations = async () => {
    try {
      const initialConversations = await getConversations();
      setConversations(initialConversations ?? []);
    } catch (error) {
      console.error("Failed to fetch convos", error);
    }
  }

  fetchConversations();
}, []);

useEffect(() => {
  if(conversationId && conversationTitle) {
    const newConversation = {
      $id: conversationId,
      title: conversationTitle
    }
    setConversations([...conversations, newConversation]);
    setActiveConversation(newConversation);
  }
}, [conversationId, conversationTitle]);

 // Handle sidebar animation
 useEffect(() => {
  Animated.timing(sidebarWidth, {
    toValue: isSidebarOpen ? 288 : 0,
    duration: 300,
    useNativeDriver: false,
  }).start();
}, [isSidebarOpen]);


  const submit = async (form : any) => {
    if(!form.audio) {
      return Alert.alert('Please fill in all the details');
    }

    setUploading(true);

    try {
      const fileUrl = await createAudio(form);
      console.log(fileUrl);
      const result: any = await sendAudioToBackend(String(fileUrl), activeConversation.$id);
      console.log("Sent audio to backend");
      setLlmResponse(result.llm_response);
      setTranscription(result.transcription);
      const url = result.audio_url;
      const fetchedUrl = await fetchAudio(url);
      setLlmFileURL(fetchedUrl ?? '');
    } catch (error : unknown) {
      throw new Error(String(error));
    }
    finally{
      setUploading(false);
    }
  }

  // const createNewConversation = async() => {

  //   const isAllowed = isWithinScheduledTime(meetings);
  //   if(!isAllowed) {
  //     Alert.alert('Error', 'You can only create a new chat during your scheduled meeting time.');
  //     return;
  //   }
  //   try {
  //     const conversationId = await createConversation(String(conversationTitle));
  //     console.log(conversationId);
  //     const newConversation = {
  //       $id: conversationId
  //     }
  //     setConversations([newConversation, ...conversations]);
  //     setActiveConversation(newConversation);
  //   } catch(err) {
  //       console.error(err);
  //   }
  // }

  const handleDeleteConversation = async(conversationId : string) => {
    try {
      Alert.alert(
        'Confirm Deletion',
        'Are you sure you want to delete this conversation?',
        [
          {text : 'Cancel', style : 'cancel'},
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              await deleteConversation(conversationId);
              Alert.alert('Success', 'Conversation deleted Successfully.');
              const updatedConversations = conversations.filter(
                (conversation) => conversation.$id !== conversationId
              );
              setConversations(updatedConversations);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to delete conversation. Please try again.');
    }
  }

  const startRecording = async () => {
    setIsRecording(true);
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
        staysActiveInBackground: true
      });

      console.log('Starting recording..');
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY = configs);
      await newRecording.startAsync();
      setRecording(newRecording);
      setForm((prevForm) => ({
        ...prevForm,
        audio: recording
      }))
      console.log('Recording started');
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  }

  const stopRecording = async () => {
    console.log('Stopping recording..');
    await recording?.stopAndUnloadAsync();
    const uri = recording?.getURI();
    setAudioUri(String(uri));

    const fileName = `recording-${Date.now()}.m4a`;

    const fileInfo : any = await FileSystem.getInfoAsync(String(uri));
    console.log(fileInfo);
    const fileData = {
      uri: uri,
      name: fileName,
      type: 'audio/m4a',
      size: fileInfo?.size,
    };
    console.log(fileData.size);
    setForm((prevForm) => ({
      ...prevForm,
      audio: recording ?? null
    }))
    setIsRecording(false);
    console.log('Recording stopped and stored at', uri);
    await submit({audio: fileData});
    console.log('Audio uploaded to appwrite');
  }
  // Function to play the recorded sound
  const playSound = async () => {
    if (!llmFileURL) return;

    console.log('Loading sound from URI:', llmFileURL);

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: false,
      staysActiveInBackground: true,
      playThroughEarpieceAndroid: false,
    });

    const { sound: newSound, status } = await Audio.Sound.createAsync(
      { uri: llmFileURL },
      { shouldPlay: true,
        volume: 1.0,
        rate: 1.0,
        shouldCorrectPitch: true,
        pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
      },
      (status) => {
        console.log("Sound status update:",status)
      }
    );

    if(!status.isLoaded) {
      console.error("Sound failed to load");
      return;
    }
    setSound(newSound);

    console.log('Playing sound');
    const playbackStatus = await newSound.playAsync();
    console.log('Playback status:', playbackStatus);
     // Listen for playback completion
     newSound.setOnPlaybackStatusUpdate((status) => {
      if ("didJustFinish" in status && status.didJustFinish) {
        console.log('Playback finished');
        // Reset audio mode after playback if needed
        Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: true
        });
      }
    });
  };


  const handleConversationclick = async (conversation : any) => {
    try {
      setMessages([]);
      setActiveConversation(conversation);
      setIsBottomSheetVisible(true);
      console.log(conversation.$id);
      const fetchedMessages = await getMessages(conversation.$id);
      setMessages(fetchedMessages ?? []);
      console.log(fetchedMessages);
    } catch(error) {
      console.error(error);
      setMessages([]);
    }
  }

  const ConversationItem = ({item, isActive} : {item : any, isActive : boolean}) => (
      <TouchableOpacity
      onPress = {() => handleConversationclick(item)}
      className={`p-4 mx-2 mb-2 rounded-lg transition-all ${
        isActive ? 'bg-cyan-600/80 hover:bg-cyan-600' : 'bg-zinc-800 hover:bg-zinc-700'
      }
      flex-row items-center space-x-3
      `}
      >
        <View className="flex-row items-center">
          <MessageSquare size={20} color={isActive ? 'white' : '#94a3b8'} />
          <Text className="text-white font-medium ml-3">{item.title}</Text>
        </View>
      <TouchableOpacity onPress={() => handleDeleteConversation(item.$id)}>
        <Trash2 size={20} color="#EF4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  )


  const BottomSheet = () => (
    
    <Modal
    visible = {isBottomSheetVisible}
    transparent = {true}
    animationType='slide'
    onRequestClose={() => setIsBottomSheetVisible(false)}
  >
    <View className="flex-1 justify-end bg-black/50">
      <View className="bg-zinc-900 rounded-t-lg h-[70%]">
        {/* Header */}
        <View className="px-4 py-3 border-b border-zinc-800 flex-row justify-between items-center">
          <Text className="text-white text-lg font-bold">
            {activeConversation?.title || 'Previous Conversation'}
          </Text>
          <Pressable
            onPress={() => setIsBottomSheetVisible(false)}
            className="p-2 rounded-full bg-zinc-800 active:bg-zinc-700"
          >
            <X size={24} color="white" />
          </Pressable>
        </View>
        {/* Message List */}
        <View>
        <FlatList
          data={messages}
          keyExtractor={(item) => item.messageId}
          renderItem={({ item }) => (
            <View className="px-4 py-3 border-b border-zinc-800">
              <Text className="text-zinc-400 font-semibold">User:</Text>
              <Text className="text-zinc-200 mb-2">{item.inputText}</Text>
              <Text className="text-zinc-400 font-semibold">Response:</Text>
              <Text className="text-zinc-200">{item.responseText}</Text>
            </View>
          )}
          className="flex-grow"
          contentContainerStyle={{ flexGrow: 1 }}
        />
        </View>
      </View>
    </View>
  </Modal>
  )

  // Cleanup sound on component unmount
  useEffect(() => {
    return sound
      ? () => {
          console.log('Unloading sound');
          sound.unloadAsync();
        }
      : undefined;
  }, [sound]);

  return (
    <View className="flex-1 flex-row bg-zinc-900">
      {/* SideBar */}
      <Animated.View
      style={{
        width: sidebarWidth,
        borderRightWidth: 1,
        borderColor: '#27272a', // Adjust to match 'border-zinc-800'
        overflow: 'hidden',
      }}
      className="bg-zinc-900"
      >
        <View
        className={`${
          isSidebarOpen ? 'w-72' : 'w-0'
        } border-r border-zinc-800 transition-all duration-300 overflow-hidden`}
        >

          {/* Conversations Section*/}
        <View className="p-4 border-b border-zinc-800">
          <Text className="text-xl font-semibold text-white mt-3">Conversations</Text>
          {/* <Pressable
            onPress={() => createNewConversation()}
            className="flex-row items-center justify-center space-x-2 bg-cyan-600 rounded-xl p-3"
          >
            <PlusCircle size={20} color="white" />
            <Text className="text-white font-medium">New Chat</Text>
          </Pressable> */}
        </View>
        {conversations.length > 0 ? (
          <FlatList
          data = {conversations}
          keyExtractor={(item) => item.$id}
          renderItem = {({item}) => (
            <ConversationItem item={item} isActive={activeConversation?.$id === item.$id} />
          )}
          className='py-2'
          />
        ) : (
          <View
            className = 'items-center mt-40'>
            <Text className="text-zinc-500 text-lg mt-14">No conversations</Text>
          </View>
        )}
      </View>
      </Animated.View>

      {/* Bottom sheet */}
      {messages.length > 0 && (
        <BottomSheet />
      )}
      

      {/* Main Chat Area */}
      <View className = 'flex-1 relative'>
        {/* Toolbar */}
        <View className = 'absolute top-0 left-0 right-0 p-4 bg-zinc-900/90 backdrop-blur-sm border-b border-zinc-800 flex-row justify-between items-center'>
          <View className = 'flex-row items-center space-x-4'>
            <Pressable
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-zinc-800 rounded-lg"
            >
              <AppWindow color='white'/>

            </Pressable>
            <Text className="text-lg font-semibold text-white">
              {isSidebarOpen ? '' : (activeConversation?.title || 'New Conversation')}
            </Text>
          </View>
        </View>

        {/* Chat History */}
        <View className = 'flex-1 items-center justify-center pt-16'>
        <MicrophoneButton 
          isRecording={isRecording}
          onPress={isRecording ? stopRecording : startRecording} 
        />
        {audioUri && (
          <Pressable
            onPress = {playSound}
            className = 'mt-4 px-6 py-3 bg-indigo-600 rounded-lg'
          >
            <Text className = 'text-white font-medium'>Play Sound</Text>
          </Pressable>
        )}
        </View>
      </View>
      <LoadingOverlay visible={uploading} />
    </View>
  );
};

export default Conversation;