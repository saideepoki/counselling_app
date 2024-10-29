# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

## Workflow and Key Features

### 1. **Recording the User’s Input**
- The user initiates the conversation by pressing the microphone button in the app.
- Once the recording is completed, the encrypted audio file is stored in the **Appwrite Storage Bucket**.
- The URL of the stored audio file is also saved in the `audioFiles` collection in the database.

### 2. **Processing the Audio**
- After the audio is stored, the **audio URL** is sent to our backend **API**.
- The API fetches the audio file using the provided URL and passes it to **Distil-Whisper** to transcribe the audio into text.

### 3. **Generating a Response**
- The transcribed text is then sent to the **LLaMA-3.1**, which processes the user’s input and generates a response.

### 4. **Converting the Response to Audio**
- The generated text response is passed to **Edge-TTS** to convert it back into speech format.
- The resulting audio file is stored in **Mega Storage**, and its URL is generated.

### 5. **Delivering the Audio Response**
- The generated **audio URL** is then sent back to the frontend of the app.
- The app retrieves the audio and plays it for the user, completing the conversational loop.
