import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { Audio } from 'expo-av';
import MicrophoneButton from '../../components/MicrophoneButton';
import { Recording } from 'expo-av/build/Audio';
import { createAudio } from '@/lib/appwrite';
import * as FileSystem from 'expo-file-system';

const audioRecorderPlayer = new AudioRecorderPlayer();

const Conversation: React.FC = () => {
  const [recording, setRecording] = useState<Recording | null>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    audio: null as Recording | null | undefined,
  });
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  // const [transcription, setTranscription] = useState<string | null>(null);
  // const [llmResponse, setLlmResponse] = useState<string | null>(null);



  const submit = async (form : any) => {
    if(!form.audio) {
      return Alert.alert('Please fill in all the details');
    }

    setUploading(true);

    try {
      await createAudio(form);
    } catch (error : unknown) {
      throw new Error(String(error));
    }
    finally{
      setUploading(false);
    }
  }

  const startRecording = async () => {
    try {
      if (permissionResponse?.status !== 'granted') {
        console.log('Requesting permission..');
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log('Starting recording..');
      const { recording } = await Audio.Recording.createAsync( Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
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
    const fileInfo = await FileSystem.getInfoAsync(String(uri));
    console.log(fileInfo);
    const fileData = {
      uri: uri,
      name: fileInfo.uri.split('/').pop(), // Extract the file name
      type: 'audio/m4a',
      size: fileInfo?.size,
    };
    console.log(fileData.size);
    setForm((prevForm) => ({
      ...prevForm,
      audio: recording ?? null
    }))
    console.log('Recording stopped and stored at', uri);
    await submit({audio: fileData});
    console.log('Audio uploaded to appwrite');
  }

  // const onStopRecord = async () => {
  //   const result : any = await audioRecorderPlayer.stopRecorder();
  //   audioRecorderPlayer.removeRecordBackListener();
  //   setIsRecording(false);
  //   uploadToAppwrite(result);
  //   setTranscription(result.transcription);
  //   setLlmResponse(result.llm_response);
  // };


  // const handleMicPress = () => {
  //   if (isRecording) {
  //     onStopRecord();
  //   } else {
  //     onStartRecord();
  //   }
  // };

  // Function to play the recorded sound
  const playSound = async () => {
    if (!audioUri) return;

    console.log('Loading sound from URI:', audioUri);
    const { sound } = await Audio.Sound.createAsync(
      { uri: audioUri },
      { shouldPlay: true }
    );
    setSound(sound);

    console.log('Playing sound');
    await sound.playAsync();
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
    <View className="flex-1 justify-center bg-cyan-500 p-10">
      <Button
        title={recording ? 'Stop Recording' : 'Start Recording'}
        onPress={recording ? stopRecording : startRecording}
      />
      {audioUri && (
        <Button title="Play Sound" onPress={playSound} />
      )}
    </View>
  );
};

export default Conversation;