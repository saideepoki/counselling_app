import os
import uuid
import logging
import requests  # Import requests for downloading files
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from groq import Groq
import edge_tts
from mega import Mega
import uvicorn
from urllib.parse import quote
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.input_file import InputFile
from appwrite.id import ID

class Settings(BaseSettings):
    GROQ_API_KEY: str
    APPWRITE_ENDPOINT: str
    APPWRITE_PROJECT_ID: str
    APPWRITE_API_KEY: str
    APPWRITE_BUCKET_ID: str
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Initialize Groq client
client = Groq(api_key=settings.GROQ_API_KEY)

# Initialize Appwrite client
appwrite_client = Client()
appwrite_client.set_endpoint(settings.APPWRITE_ENDPOINT)
appwrite_client.set_project(settings.APPWRITE_PROJECT_ID)
appwrite_client.set_key(settings.APPWRITE_API_KEY)

storage = Storage(appwrite_client)

async def text_to_speech(text: str, output_file: str):
    communicate = edge_tts.Communicate(text, "en-AU-NatashaNeural")
    await communicate.save(output_file)

def upload_to_appwrite(file_path: str):
    try:
        # file_name = os.path.basename(file_path)
        result = storage.create_file(
            bucket_id=settings.APPWRITE_BUCKET_ID,
            file_id=ID.unique(),
            file=InputFile.from_path(file_path)
        )


        #URL for the uploaded file
        file_url = f"{settings.APPWRITE_ENDPOINT}/storage/buckets/{settings.APPWRITE_BUCKET_ID}/files/{result['$id']}/view?project={settings.APPWRITE_PROJECT_ID}&mode=admin"

        logger.info(file_url)
        return file_url

    except Exception as e:
        logger.error(f"Error uploading to Appwrite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload file to Appwrite")

def download_file_from_url(url: str, save_path: str):
    try:

        encoded_url = quote(url, safe='/:?=&')
        response = requests.get(encoded_url)
        logger.info(f"{response.content}")
        if response.status_code == 200:
            with open(save_path, "wb") as file:
                file.write(response.content)
            logger.info(f"File downloaded from URL and saved as {save_path}")
        else:
            raise HTTPException(status_code=400, detail="Failed to download the file from the provided URL")
    except Exception as e:
        logger.error(f"Error downloading file from URL: {str(e)}")
        raise HTTPException(status_code=500, detail="An error occurred while downloading the file")


@app.get("/process_audio/")
async def process_audio(url: str = Query(..., description="URL of the audio file to be processed")):
    try:
        # Download the audio file from the provided URL
        file_path = f"temp_{uuid.uuid4()}.mp3"
        download_file_from_url(url, file_path)

        with open(file_path, "rb") as audio_file:
            transcription = client.audio.transcriptions.create(
                file=audio_file,
                model="distil-whisper-large-v3-en",
                response_format="verbose_json",
            )
        logger.info("Audio transcription completed")

        completion = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {
                    "role": "assistant",
                    "content": transcription.text
                }
            ],
            temperature=0.2,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        llm_response = completion.choices[0].message.content
        logger.info("LLM processing completed")

        tts_output_file = f"tts_output_{uuid.uuid4()}.mp3"
        await text_to_speech(llm_response, tts_output_file)
        logger.info("Text-to-speech conversion completed")

        appwrite_url = upload_to_appwrite(tts_output_file)
        logger.info("Audio file uploaded to MEGA")

        os.remove(file_path)
        os.remove(tts_output_file)
        logger.info("Temporary files removed")

        return JSONResponse(content={
            "transcription": transcription.text,
            "llm_response": llm_response,
            "audio_url": appwrite_url
        })

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
