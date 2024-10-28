import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import 'blob-polyfill';


export const sendAudioToBackend = async (fileUrl : string) => {

  const apiUrl = `http://10.79.113.18:8000/process_audio/?url=${fileUrl}`;
  try {
    const result = await axios.get(apiUrl);
    console.log("Audio fetched from backend");
    return result.data;
  } catch (error) {
      throw new Error(String(error));
  }
}


export const fetchAudio = async (audioUrl : string) => {
  try {
    console.log(audioUrl);
    // Fetch the audio file as a blob
    const res = await fetch(audioUrl);
    console.log(res);

    // if (!res.ok) {
    //   throw new Error('Failed to download audio file');
    // }

    const blob = await res.blob();
    console.log(blob)
    const fileUri = `${FileSystem.cacheDirectory}audio_${Date.now()}.m4a`;
    const {uri} = await FileSystem.downloadAsync(
      audioUrl,
      fileUri
    )

    console.log('Audio file downloaded to:', uri);

      // Verify the file exists and has content
      const fileInfo = await FileSystem.getInfoAsync(uri);
      console.log('File info:', fileInfo);

    console.log('Audio file saved and ready to play:', fileUri);
    return uri;
  } catch (error) {
    console.error('Error fetching audio:', error);
    throw error;
  }
};




