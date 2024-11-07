import React, { useEffect, useState } from 'react';
import { View, Button, Alert, FlatList, TouchableOpacity, Text, Pressable } from 'react-native';
import { Audio } from 'expo-av';
import MicrophoneButton from '../../components/MicrophoneButton';
import { AndroidAudioEncoder, AndroidOutputFormat, IOSAudioQuality, IOSOutputFormat, Recording } from 'expo-av/build/Audio';
import { createAudio, createConversation } from '@/lib/appwrite';
import * as FileSystem from 'expo-file-system';
import { fetchAudio, sendAudioToBackend } from '@/lib/backend';
import { ChevronLeft, ChevronRight, PlusCircle, Search, MessageSquare, AppWindow} from "lucide-react-native";


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
  const [conversations, setConversations] = useState<any[]>([
    { id: '1', title: 'Conversation 1', timestamp: '2m ago' },
    { id: '2', title: 'Conversation 2', timestamp: '1h ago' },
   ]
  );
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);



  const submit = async (form : any) => {
    if(!form.audio) {
      return Alert.alert('Please fill in all the details');
    }

    setUploading(true);

    try {
      const fileUrl = await createAudio(form);
      console.log(fileUrl);
      const result: any = await sendAudioToBackend(String(fileUrl));
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

  const createNewConversation = async() => {
    try {
      const conversationId = await createConversation();
      console.log(conversationId);
      const newConversation = {
        id: conversationId,
        title: `Conversation ${conversations.length + 1}`,
      }
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation);
    } catch(err) {

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
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
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
    // Move the recording to the new directory with the new file name
    const fileInfo : any = await FileSystem.getInfoAsync(String(uri));
    console.log(fileInfo);
    const fileData = {
      uri: uri,
      name: fileName, // Extract the file name
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
    const { sound } = await Audio.Sound.createAsync(
      { uri: llmFileURL },
      { shouldPlay: true,
        volume: 1.0,
        rate: 1.0,
        shouldCorrectPitch: true,  // Add pitch correction
        pitchCorrectionQuality: Audio.PitchCorrectionQuality.High,
      }
    );
    setSound(sound);

    console.log('Playing sound');
    await sound.playAsync(
    );
  };

  const ConversationItem = ({item, isActive} : {item : any, isActive : boolean}) => (
      <TouchableOpacity
      onPress = {() => setActiveConversation(item)}
      className={`p-4 mx-2 mb-2 rounded-lg transition-all ${
        isActive ? 'bg-cyan-600/80 hover:bg-cyan-600' : 'bg-zinc-800 hover:bg-zinc-700'
      }`}
      >
        <View className='flex-row items-center space-x-3'>
          <MessageSquare size={20} color={isActive ? 'white' : '#94a3b8'} />
          <View>
            <Text className="text-white font-medium">{item.title}</Text>
            <Text className="text-zinc-400 text-sm">{item.timestamp}</Text>
          </View>
        </View>
      </TouchableOpacity>
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
      <View
      className={`${
        isSidebarOpen ? 'w-72' : 'w-0'
      } border-r border-zinc-800 transition-all duration-300 overflow-hidden`}
      >
        <View className="p-4 border-b border-zinc-800">
          <Text className="text-xl font-semibold text-white mb-4">Conversations</Text>
          <Pressable
            onPress={() => createNewConversation()}
            className="flex-row items-center justify-center space-x-2 bg-gradient-to-r from-cyan-500 to-cyan-600 p-2 rounded-lg hover:from-cyan-600 hover:to-cyan-700 active:from-cyan-700 active:to-cyan-800"
          >
            <PlusCircle size={20} color="white" />
            <Text className="text-white font-medium">New Chat</Text>
          </Pressable>
        </View>
      <FlatList
      data = {conversations}
      keyExtractor={(item) => item.id}
      renderItem = {({item}) => (
        <ConversationItem item={item} isActive={activeConversation?.id === item.id} />
      )}
      className='py-2'
      />
      </View>

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
              {activeConversation?.title || 'New Conversation'}
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
    </View>
  );
};

export default Conversation;