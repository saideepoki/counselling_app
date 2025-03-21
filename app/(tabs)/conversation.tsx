import React, { useEffect, useState } from 'react';
import { View, Button, Alert } from 'react-native';
import { Audio } from 'expo-av';
import MicrophoneButton from '../../components/MicrophoneButton';
import { AndroidAudioEncoder, AndroidOutputFormat, IOSAudioQuality, IOSOutputFormat, Recording } from 'expo-av/build/Audio';
import { createAudio } from '@/lib/appwrite';
import * as FileSystem from 'expo-file-system';
import { fetchAudio, sendAudioToBackend } from '@/lib/backend';
import { PlayCircle } from "lucide-react";


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
    <View className="flex-1 justify-center bg-zinc-900 p-10">
      <MicrophoneButton isRecording={isRecording} onPress={isRecording ? stopRecording : startRecording} />

      {audioUri && (
        <Button title="Play Sound" onPress={playSound} />
      )}
    </View>
  );
};

export default Conversation;