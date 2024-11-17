import os
import json
import uuid
import logging
from datetime import datetime

import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings
from groq import Groq
import edge_tts
import uvicorn
from urllib.parse import quote
from appwrite.client import Client
from appwrite.services.storage import Storage
from appwrite.services.databases import Databases
from appwrite.input_file import InputFile
from appwrite.id import ID
from langchain_groq import ChatGroq
from langchain.chains.llm import LLMChain
from langchain.prompts import PromptTemplate
from langchain.memory import ConversationSummaryBufferMemory
from langchain.schema import AIMessage, HumanMessage
from appwrite import query

class Settings(BaseSettings):
    GROQ_API_KEY: str
    APPWRITE_ENDPOINT: str
    APPWRITE_PROJECT_ID: str
    APPWRITE_API_KEY: str
    APPWRITE_BUCKET_ID: str
    APPWRITE_DATABASE_ID: str
    MESSAGES_COLLECTION_ID: str
    CONVERSATION_META_COLLECTION_ID: str
    MESSAGES_META_COLLECTION_ID: str
    ALLOWED_ORIGINS: list = ["*"]

    class Config:
        env_file = ".env"

settings = Settings()

# Logging setup
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

# Initialize Appwrite clients
appwrite_client = Client()
appwrite_client.set_endpoint(settings.APPWRITE_ENDPOINT)
appwrite_client.set_project(settings.APPWRITE_PROJECT_ID)
appwrite_client.set_key(settings.APPWRITE_API_KEY)
appwrite_client.set_self_signed(True)

storage = Storage(appwrite_client)
databases = Databases(appwrite_client)

# Initialize Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY)

# Langchain setup
llm = ChatGroq(
    groq_api_key=settings.GROQ_API_KEY,
    model_name="llama-3.1-8b-instant",
    temperature=0.7
)

tracker_prompt = PromptTemplate(
    input_variables=["conversation", "conversation_meta_data"],
    template="""
    You are an expert counseling analyst. Your task is to:
    1. Analyze if the latest user input discusses each life domain
    2. Consider previous conversation metrics
    3. Update the previous conversation metrics based on the current user scores
    4. Determine the most beneficial direction for the next question

    Previous Conversation Metrics:
    {conversation_meta_data}

    Latest User Input to Analyze:
    {conversation}

    Please analyze whether the latest input discusses each of these life domains (score 0 if not mentioned, 1-5 based on depth of discussion):
    1. Emotional state (feelings, mood, emotional awareness)
    2. Social Interaction (peer relationships, social support, communication)
    3. Academic strengths (learning ability, academic performance, educational goals)
    4. Family dynamics (family relationships, support system, home environment)
    5. Self Reflection (self-awareness, personal growth, identity understanding)
    6. Coping Strategies (stress management, problem-solving, resilience)
    7. Physical Well-being (health habits, exercise, sleep, nutrition)

    Coverage Depth Guidelines:
    - 0: Not mentioned at all
    - 1: Briefly mentioned
    - 2: Somewhat discussed
    - 3: Moderately explored
    - 4: Well discussed
    - 5: Deeply explored with specific details

    Instructions:
    1. First, identify which domains are covered in the new input
    2. Score the depth of coverage for mentioned domains
    3. Update the previous metrics based on the new input scores giving in the efficient way for analysis
    4. Generate a compass direction that:
       - Naturally explores uncovered or shallow areas
       - Maintains conversation flow
       - Respects emotional readiness


    Provide the response in the following JSON format:
    {{
        "scores_user_input": {{
            "emotional_state": float,
            "social_interaction": float,
            "academic_strengths": float,
            "family_dynamics": float,
            "self_reflection": float,
            "coping_strategies": float,
            "physical_wellbeing": float
        }},
        "Updated_overall_scores": {{
            "emotional_state": float,
            "social_interaction": float,
            "academic_strengths": float,
            "family_dynamics": float,
            "self_reflection": float,
            "coping_strategies": float,
            "physical_wellbeing": float
        }},
        "compass_direction": {{
            "focus_area": string,
            "suggested_approach": string,
            "next_question_guidance": string
        }}
    }}

    Remember to:
    - Consider the context and previous responses
    - Select two focus areas from the metrics we choose
    - Maintain conversation naturalness
    - Be sensitive to emotional state
    - Don't give any output except the json response format provided
    - Provide only with final calculated numbers not any calculations or reason when providing the scores
    - Avoid redundant questions
    - Ensure smooth topic transitions
    """
)

wellbeing_prompt = PromptTemplate(
    input_variables=["compass_direction"],
    template="""
You are a counselor engaging in a conversation with a user. Based on the conversation so far and the compass direction provided, generate a response that:

- Briefly acknowledges the user's previous statements.
- Continues the conversation naturally by asking a direct question focused on the specified area(s) in the compass_direction.
- Maintains continuity with the previous dialogue.
- Uses natural, conversational language appropriate for a counselor.
- Keeps the response concise, ideally within 2-3 sentences.

Conversation history:
{history}

Compass direction:
{compass_direction}

Your response should be only the counselor's reply to the user.
"""
)



memory = ConversationSummaryBufferMemory(llm=llm, max_token_limit=8000)
tracker_chain = LLMChain(llm=llm, prompt=tracker_prompt)
wellbeing_chain = LLMChain(llm=llm, prompt=wellbeing_prompt, memory = memory)

# Helper functions
async def text_to_speech(text: str, output_file: str):
    communicate = edge_tts.Communicate(text, "en-AU-NatashaNeural")
    await communicate.save(output_file)

def upload_to_appwrite(file_path: str):
    try:
        result = storage.create_file(
            bucket_id=settings.APPWRITE_BUCKET_ID,
            file_id=ID.unique(),
            file=InputFile.from_path(file_path)
        )
        
        file_url = f"{settings.APPWRITE_ENDPOINT}/storage/buckets/{settings.APPWRITE_BUCKET_ID}/files/{result['$id']}/view?project={settings.APPWRITE_PROJECT_ID}&mode=admin"
        logger.info(f"File uploaded to Appwrite: {file_url}")
        return file_url
    except Exception as e:
        logger.error(f"Error uploading to Appwrite: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to upload file to Appwrite")

def download_file_from_url(url: str, save_path: str):
    try:
        encoded_url = quote(url, safe='/:?=&')
        response = requests.get(encoded_url)
        if response.status_code == 200:
            with open(save_path, "wb") as file:
                file.write(response.content)
            logger.info(f"File downloaded and saved as {save_path}")
        else:
            raise HTTPException(status_code=400, detail="Failed to download file")
    except Exception as e:
        logger.error(f"Error downloading file: {str(e)}")
        raise HTTPException(status_code=500, detail="Download error")

async def get_conversation_history(convo_document_id: str) -> str:
    try:

        logger.info("Fetching documents of messages collection")
        # Query messages for the conversation
        messages = databases.list_documents(
            database_id=settings.APPWRITE_DATABASE_ID,
            collection_id=settings.MESSAGES_COLLECTION_ID,
            queries=[
               query.Query.equal("conversationId", convo_document_id),
               query.Query.order_asc("timestamp")
            ],
        )

        if len(messages['documents']) == 0:
            return []

        logger.info(f"documents fetched related to {convo_document_id}")

        conversation_messages = []

        for msg in messages['documents']:
            user_message = HumanMessage(content = msg['inputText'])
            assistant_message = AIMessage(content = msg['responseText'])
            conversation_messages.extend([user_message, assistant_message])

        print(conversation_messages)

        return conversation_messages
    except Exception as e:
        logger.error(f"Error fetching conversation history: {str(e)}")
        return ""

async def get_conversation_metadata(convo_document_id: str) -> dict:
    try:
        logger.info("Fetching convo meta data")
        meta_data = databases.list_documents(
            database_id=settings.APPWRITE_DATABASE_ID,
            collection_id=settings.CONVERSATION_META_COLLECTION_ID,
            queries = [
                query.Query.equal("conversationId", convo_document_id)
            ]
        )
        logger.info(f"convo meta data fetched")

        if len(meta_data['documents']) == 0:
            return {}, None

        document = meta_data['documents'][0]
        print(meta_data)
        return dict(list(document.items())[1 : 8]), meta_data['documents'][0]['$id']
    except Exception as e:
        logger.error(f"Error fetching conversation metadata: {str(e)}")
        return {}, None

@app.get("/process_audio/")
async def process_audio(
    url: str = Query(..., description="URL of the audio file"),
    user_id: str = Query(..., description="User id"),
    convo_document_id: str = Query(..., description="Conversation ID")

):
    try:
        print(url, user_id, convo_document_id)
        # Download and transcribe audio
        file_path = f"temp_{uuid.uuid4()}.mp3"
        download_file_from_url(url, file_path)

        with open(file_path, "rb") as audio_file:
            transcription = groq_client.audio.transcriptions.create(
                file=audio_file,
                model="distil-whisper-large-v3-en",
                response_format="verbose_json",
            )

        latest_user_input = transcription.text

        # Get conversation history
        conversation_history = await get_conversation_history(convo_document_id)
        logger.info("loaded convo history")
        memory.chat_memory.messages = conversation_history
        memory.chat_memory.add_user_message(latest_user_input)
        conversation_meta_data, conversation_meta_data_id = await get_conversation_metadata(convo_document_id)
        logger.info("loaded convo meta data")
        print(conversation_meta_data)

        # Track well-being metrics
        tracking_result = tracker_chain.run(
            conversation=f"User: {latest_user_input}",
            conversation_meta_data=conversation_meta_data
        )

        logger.info("loaded tracker")
        print(tracking_result)

        # Convert string to dict safely
        tracking_data = json.loads(tracking_result)

        # Convert compass_direction to a string
        compass_direction_str = f"Focus area: {tracking_data['compass_direction']['focus_area']}\n" \
                                f"Suggested approach: {tracking_data['compass_direction']['suggested_approach']}\n" \
                                f"Next question guidance: {tracking_data['compass_direction']['next_question_guidance']}"


        # Generate well-being response
        wellbeing_response = wellbeing_chain.run(
            compass_direction=compass_direction_str
        )


        logger.info("loaded wellbeing response")
        print(wellbeing_response)

        memory.chat_memory.add_ai_message(wellbeing_response)

        # Generate audio response
        tts_output_file = f"tts_output_{uuid.uuid4()}.mp3"
        await text_to_speech(wellbeing_response, tts_output_file)
        appwrite_url = upload_to_appwrite(tts_output_file)

        # create new document in messages
        message_doc = databases.create_document(
            database_id=settings.APPWRITE_DATABASE_ID,
            collection_id=settings.MESSAGES_COLLECTION_ID,
            document_id=ID.unique(),
            data={
                'userId': user_id,
                'inputText': transcription.text,
                'responseText': wellbeing_response,
                'timestamp': datetime.now().isoformat(),
                'messageId': ID.unique(),
                'conversationId': convo_document_id,
                'conversationIdString': convo_document_id
            }
        )

        logger.info("Created message doc")

        # Create new document in Message meta id
        meta_doc = databases.create_document(
            database_id=settings.APPWRITE_DATABASE_ID,
            collection_id=settings.MESSAGES_META_COLLECTION_ID,
            document_id=ID.unique(),
            data={
                'messageId': message_doc['$id'],
                'messageMetaId': ID.unique(),
                'emotionalState': tracking_data['scores_user_input']['emotional_state'],
                'socialInteractions': tracking_data['scores_user_input']['social_interaction'],
                'academicStrengths': tracking_data['scores_user_input']['academic_strengths'],
                'familyDynamics': tracking_data['scores_user_input']['family_dynamics'],
                'selfReflection': tracking_data['scores_user_input']['self_reflection'],
                'copingStrategies': tracking_data['scores_user_input']['coping_strategies'],
                'physicalWellBeing': tracking_data['scores_user_input']['physical_wellbeing']
            }
        )

        logger.info("Created message_meta doc")

        #update document in conversation_metaid

        if conversation_meta_data_id is None:
            databases.create_document(
                database_id=settings.APPWRITE_DATABASE_ID,
                collection_id=settings.CONVERSATION_META_COLLECTION_ID,
                document_id=ID.unique(),
                data={
                    'conversationId': convo_document_id,
                    'metaId': ID.unique(),
                    'emotionalState': tracking_data['scores_user_input']['emotional_state'],
                    'socialInteractions': tracking_data['scores_user_input']['social_interaction'],
                    'academicStrengths': tracking_data['scores_user_input']['academic_strengths'],
                    'familyDynamics': tracking_data['scores_user_input']['family_dynamics'],
                    'selfReflection': tracking_data['scores_user_input']['self_reflection'],
                    'copingStrategies': tracking_data['scores_user_input']['coping_strategies'],
                    'physicalWellBeing': tracking_data['scores_user_input']['physical_wellbeing'],
                    'conversationIdString': convo_document_id
                }
            )

        else:
            databases.update_document(
            database_id=settings.APPWRITE_DATABASE_ID,
            collection_id=settings.CONVERSATION_META_COLLECTION_ID,
            document_id=conversation_meta_data_id,
            data={
                'conversationId': convo_document_id,
                'metaId': ID.unique(),
                'emotionalState': tracking_data['scores_user_input']['emotional_state'],
                'socialInteractions': tracking_data['scores_user_input']['social_interaction'],
                'academicStrengths': tracking_data['scores_user_input']['academic_strengths'],
                'familyDynamics': tracking_data['scores_user_input']['family_dynamics'],
                'selfReflection': tracking_data['scores_user_input']['self_reflection'],
                'copingStrategies': tracking_data['scores_user_input']['coping_strategies'],
                'physicalWellBeing': tracking_data['scores_user_input']['physical_wellbeing'],
                'conversationIdString': convo_document_id
            }
        )

        logger.info("Created convo_meta doc")

        # Cleanup
        os.remove(file_path)
        os.remove(tts_output_file)

        return JSONResponse(content={
            "transcription": transcription.text,
            "llm_response": wellbeing_response,
            "audio_url": appwrite_url,
            "tracking_data": tracking_data
        })
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)