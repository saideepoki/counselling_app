import axios from 'axios';

export const sendAudioToBackend = async (fileUrl : string) => {

  const apiUrl = `http://10.79.112.209:8000/process_audio/?url=${fileUrl}`;
  try {
    const result = await axios.get(apiUrl);
    return result.data;
  } catch (error) {
      throw new Error(String(error));
  }
}