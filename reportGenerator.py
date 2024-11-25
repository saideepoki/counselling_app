# import json
# from datetime import datetime

# import os
# os.environ["MISTRAL_API_KEY"] ="rfIETaDGYQhjffNj4AFgMxIL2KmK5j4Q"
# os.environ["GROQ_API_KEY"] = "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"

# from langchain.chains import LLMChain
# from langchain_core.prompts import PromptTemplate
# from langchain_groq import ChatGroq

# def generate_counseling_report(conversation, user_details):
#     """
#     Generates a detailed counseling report from the conversation and user details using an LLM.
    
#     Args:
#         conversation (str): Full conversation text.
#         user_details (dict): User information like name, roll number, etc.
        
#     Returns:
#         dict: JSON object containing the detailed report.
#     """
#     # Initialize the LLM
#     llm =  ChatGroq(
#         model="llama-3.1-70b-versatile",
#         temperature=1,
#         max_tokens=None,
#         timeout=None,
#         max_retries=2,
#         )
#      # Replace with your preferred LLM

#     # Define the prompt for generating insights
#     insights_prompt_template = """
#     You are an assistant trained to analyze conversations and extract counseling insights.
#     Analyze the following conversation and provide your response strictly in string format that can later be converted into the json file using the json.loads() function. Include the following fields:
#     - "emotional_wellbeing": (sentiment, stress_level, mood_patterns)
#     - "academic_concerns": (specific_issues, time_management, performance_worries)
#     - "social_wellbeing": (peer_relationships, support_system, social_anxiety)
#     - "life_events": (list of significant events)
#     - "recommendations": (counseling_urgency, suggested_resources, follow_up_plan).

#     Conversation:
#     {conversation}
#     """


#     insights_prompt = PromptTemplate(
#         input_variables=["conversation"], template=insights_prompt_template
#     )
#     insights_chain = insights_prompt | llm

#     # Generate insights
#     # insights_response = insights_chain.run(conversation)
#     insights_response = insights_chain.invoke({"conversation":conversation}).content
#     insights_response = insights_response.strip()
#     # Parse insights into structured JSON
#     print(insights_response)
#     if isinstance(insights_response, dict):
#         insights = insights_response
#     else :
#         insights = json.loads(insights_response)
#     # Assemble the final report
#     report = {
#         "header": {
#             "name": user_details.get("name"),
#             "roll_number": user_details.get("roll_number"),
#             "date_of_interaction": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
#         },
#         "conversation_summary": {
#             "engagement_level": "High",
#             "overall_sentiment": insights.get("emotional_wellbeing", {}).get("sentiment", "Neutral"),
#             "key_themes": insights.get("key_themes", []),
#         },
#         "detailed_insights": insights,
#         "recommendations": insights.get("recommendations", {}),
#     }

#     return json.dumps(report, indent=4)


# # Example usage
# conversation_text = """
# User: I'm really stressed about my exams and not able to sleep well.
# Bot: I'm here to help. Can you tell me more?
# User: I feel overwhelmed with deadlines and feel like I can't talk to anyone about it.
# Bot: That sounds tough. Have you tried any strategies to manage this stress?
# User: No, I don't know where to start. I feel stuck and worried all the time.
# """
# user_info = {
#     "name": "John Doe",
#     "roll_number": "12345",
# }

# report_json = generate_counseling_report(conversation_text, user_info)
# print(report_json)


import json
from datetime import datetime
import os

# Set environment variables
os.environ["MISTRAL_API_KEY"] = "rfIETaDGYQhjffNj4AFgMxIL2KmK5j4Q"
os.environ["GROQ_API_KEY"] = "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"

from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate
from langchain_groq import ChatGroq
from tiktoken import encoding_for_model  # To calculate token lengths


def generate_counseling_report(conversation, user_details):
    """
    Generates a detailed counseling report from the conversation and user details using multiple agents.
    
    Args:
        conversation (str): Full conversation text.
        user_details (dict): User information like name, roll number, etc.
        
    Returns:
        dict: JSON object containing the detailed report.
    """
    # Initialize the LLM
    llm = ChatGroq(
        model="llama-3.1-70b-versatile",
        temperature=1,
        max_tokens=None,
        timeout=None,
        max_retries=2,
    )

    # Define prompts for each aspect of the report
    prompts = {
        "emotional_state": """
        Analyze the emotional tone of the user/Person in the following conversation between the counsellor and the user/Person. Provide the below so that the counsellor can understand the emotional state of the user/Person based on the conversation In the first line of the response, provide the overall score between 1-5, just the number and nothing else and give more information after that as mentioned below:
        - Emotional sentiment (positive/negative/neutral)
        - Stress levels (low/medium/high)
        - Mood patterns (e.g., anxious, frustrated).
        
        Conversation:
        {conversation}
        """,
        "social_state": """
        Evaluate the user's social and peer relationships from the conversation. Provide the below so that the counsellor can understand the emotional state of the user/Person based on the conversation  provide the overall score between 1-5, just the number and nothing else and give more information after that as mentioned below:
        - Peer relationships (good/limited/poor)
        - Support system (available/limited/lacking)
        - Social anxiety levels (low/medium/high).
        
        Conversation:
        {conversation}
        """,
        "coping_mechanisms": """
        Analyze the user's coping mechanisms based on the conversation. Provide the below so that the counsellor can understand the emotional state of the user/Person based on the conversation  provide the overall score between 1-5, just the number and nothing else and give more information after that as mentioned below:

        - Effectiveness of current strategies (low/medium/high)
        - Mentioned healthy/unhealthy strategies.
        
        Conversation:
        {conversation}
        """,
        "environmental_factors": """
        Assess external factors impacting the user's mental state. Provide the below so that the counsellor can understand the emotional state of the user/Person based on the conversation  provide the overall score between 1-5, just the number and nothing else and give more information after that as mentioned below:
        - Living conditions, financial stress, or community environment impacts.
        
        Conversation:
        {conversation}
        """,
        "academic_state": """
        Analyze the user's academic state from the conversation. Provide the below so that the counsellor can understand the emotional state of the user/Person based on the conversation.  provide the overall score between 1-5, just the number and nothing else and give more information after that as mentioned below:
        - Stress levels (low/medium/high)
        - Productivity (low/medium/high)
        - Key academic challenges (e.g., time management, exam pressure).
        
        Conversation:
        {conversation}
        """,
        "recommendations": """
        Based on the insights, Provide the below so that the counsellor can understand the emotional state of the user/Person based on the conversation.  provide the overall score between 1-5, just the number and nothing else and give more information after that as mentioned below:
        - Counseling urgency (low/medium/high)
        - Suggested resources or workshops
        - Follow-up plan (e.g., frequency, duration).
        
        Conversation:
        {conversation}
        """,
    }

    # Function to process each prompt
    def run_agent(prompt, context):
        chain = LLMChain(llm=llm, prompt=PromptTemplate(input_variables=["conversation"], template=prompt))
        output = chain.invoke({"conversation": context})
        # print("______________________________________________________________________________")
        # print(output['text'])
        # print(type(output))
        # print(output.keys())
        # return json.loads(chain.invoke({"conversation": context}).content.strip())
        return output['text'].strip()

    # Run all agents
    insights = {}
    for key, prompt in prompts.items():
        insights[key] = run_agent(prompt, conversation)

    # Assemble the final report
    try:
        emo_score = int(insights["emotional_state"][0])
    except:
        emo_score = 0
    
    try: 
        social_score += int(insights["social_state"][0])
    except:
        social_score = 0
    
    try:
        coping_score += int(insights["coping_mechanisms"][0])
    except:
        coping_score = 0

    try:
        env_score += int(insights["environmental_factors"][0])
    except:
        env_score = 0

    try:
        academic_score += int(insights["academic_state"][0])
    except:
        academic_score = 0

    total_score = emo_score + social_score + coping_score + env_score + academic_score
    risk_level = (
        "Low Risk (Minimal Intervention Required)" if total_score <= 5 else
        "Monitor and possibly refer to a counselor" if total_score <= 10 else
        "High Risk (Recommend immediate intervention and support)"
    )

    report = {
        "client_info": {
            "name": user_details.get("name"),
            "roll_number": user_details.get("roll_number"),
            "date_of_interaction": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        "interaction_details": {
            "duration": "45 minutes",
            "messages_exchanged": 42,  # Example value
        },
        "observations": {
            "emotional_state": insights["emotional_state"],
            "social_state": insights["social_state"],
            "coping_mechanisms": insights["coping_mechanisms"],
            "environmental_factors": insights["environmental_factors"],
            "academic_state": insights["academic_state"],
            "total_score": total_score,
            "risk_level": risk_level,
        },
        "recommendations": insights["recommendations"],
        "ai_confidence_notes": "This report is AI-generated and may miss nuanced details.",
    }

    return json.dumps(report, indent=4)


import json

def get_conversation_history(file_path):
    """
    Reads a JSON file containing conversation logs and reconstructs the conversation history.

    Args:
        file_path (str): Path to the JSON file containing the conversation logs.

    Returns:
        str: A reconstructed conversation history as a single string.
    """
    try:
        # Load the JSON file
        with open(file_path, 'r', encoding='utf-8') as file:
            conversations = json.load(file)

        # Validate JSON structure
        if not isinstance(conversations, list) or not all('role' in conv and 'content' in conv for conv in conversations):
            raise ValueError("Invalid conversation file format.")

        # Reconstruct conversation history
        conversation_history = ""
        for entry in conversations:
            role = entry["role"].capitalize()  # Capitalize role for formatting
            content = entry["content"].strip()
            conversation_history += f"{role}: {content}\n\n"

        return conversation_history.strip()

    except FileNotFoundError:
        return "Error: Conversation file not found."
    except json.JSONDecodeError:
        return "Error: Invalid JSON format."
    except Exception as e:
        return f"An unexpected error occurred: {str(e)}"



# Example usage
conversation_file_path = "ConversationDataGen/conversation_short.json"  # Path to your JSON file
conversation_text = get_conversation_history(conversation_file_path)
# print(conversation_text)

# Example usage
# conversation_text = """
# User: I'm really stressed about my exams and not able to sleep well.
# Bot: I'm here to help. Can you tell me more?
# User: I feel overwhelmed with deadlines and feel like I can't talk to anyone about it.
# Bot: That sounds tough. Have you tried any strategies to manage this stress?
# User: No, I don't know where to start. I feel stuck and worried all the time.
# """
user_info = {
    "name": "John Doe",
    "roll_number": "12345",
}

report_json = generate_counseling_report(conversation_text, user_info)
print(report_json)
