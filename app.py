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

class Settings(BaseSettings):
    GROQ_API_KEY: str
    MEGA_EMAIL: str
    MEGA_PASSWORD: str
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = Groq(api_key=settings.GROQ_API_KEY)
mega = Mega()
m = mega.login(settings.MEGA_EMAIL, settings.MEGA_PASSWORD)

async def text_to_speech(text: str, output_file: str):
    communicate = edge_tts.Communicate(text, "en-AU-NatashaNeural")
    await communicate.save(output_file)

def upload_to_mega(file_path: str):
    file = m.upload(file_path)
    return m.get_upload_link(file)

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


@app.post("/process_audio/")
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
                    "role": "user",
                    "content": transcription.text
                }
            ],
            temperature=1,
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

        mega_url = upload_to_mega(tts_output_file)
        logger.info("Audio file uploaded to MEGA")

        os.remove(file_path)
        os.remove(tts_output_file)
        logger.info("Temporary files removed")

        return JSONResponse(content={
            "transcription": transcription.text,
            "llm_response": llm_response,
            "audio_url": mega_url
        })

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
