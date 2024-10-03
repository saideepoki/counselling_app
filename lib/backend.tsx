import axios from 'axios';
import Sound from 'react-native-sound';

export const playChatbotResponse = async (audioUrl: string) => {
    const sound = new Sound(audioUrl, Sound.MAIN_BUNDLE, (error) => {
      if (error) {
        console.error('Failed to load the sound', error);
        return;
      }

      // Play the sound
      sound.play(() => {
        // Release the audio resource after it finishes playing
        sound.release();
      });
    });
  };

  export const sendAudioToBackend = async (audioUrl: string) => {
    try {
      const response = await axios.post('http://your-fastapi-url.com/process-audio-url/', {
        audio_url: audioUrl,
      });
  
      // Expecting both text and audio response from the backend
      return response.data;  // This should contain text and audioUrl fields
    } catch (error) {
      console.error('Error sending audio to backend:', error);
      throw error;
    }
  };