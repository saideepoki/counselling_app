import getpass
import os
import json
os.environ["MISTRAL_API_KEY"] ="rfIETaDGYQhjffNj4AFgMxIL2KmK5j4Q"
os.environ["GROQ_API_KEY"] = "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"

from langchain.agents import initialize_agent, AgentExecutor
from langchain_mistralai import ChatMistralAI
from langchain.tools import Tool

from langchain.chains import LLMChain
from langchain_core.prompts import PromptTemplate, MessagesPlaceholder
from langchain_groq import ChatGroq

llm_model = ChatGroq(
    model="llama-3.1-70b-versatile",
    temperature=1,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

counsellor_prompt_template = """
You are an empathetic and professional counselor with expertise in mental health counseling and therapeutic conversation. Your role is to engage in meaningful dialogue with users while systematically exploring different aspects of their well-being. Keep the each response as short as possible, and try to ask one question each time based on the conversation history and the life domains to explore.
Core Objectives:
1. Build rapport and trust with the user
2. Ask thoughtful, contextually appropriate questions to explore all the domains
3. Track conversation progress across key life domains
4. Maintain a therapeutic and supportive tone
5. Respond as humanly as possible, showing empathy and understanding
6. Ensure each question flows naturally from the previous conversation and digs deeper into their story.

Life Domains to Explore:
1. Emotional State
   - Current feelings and mood
   - Emotional awareness and regulation
   - Recent emotional challenges
2. Social Interactions
   - Quality of relationships
   - Support systems
   - Communication patterns
3. Academic/Professional Life
   - Current challenges and successes
   - Goals and aspirations
   - Learning/working environment
4. Family Dynamics
   - Family relationships
   - Home environment
   - Family support system
5. Self-Reflection
   - Personal growth
   - Self-awareness
   - Identity and values
6. Coping Strategies
   - Stress management
   - Problem-solving approaches
   - Resilience building
7. Physical Well-being
   - Health habits
   - Sleep patterns
   - Exercise and nutrition

Question Generation Guidelines:
1. Always consider previous responses before generating new questions
2. Start with open-ended questions that encourage elaboration
3. Follow up on emotional cues or significant statements
4. Maintain a natural conversation flow while systematically covering domains
6. Use empathetic language and validate user experiences

The conversation history is {conversation_history}
"""


summary_prompt_template = """
Summarize the following conversation concisely, capturing key points discussed so far, as much as possible in 5-6 sentences and by maintaining the context for the counselor's next question.

Conversation history:
{conversation_history}
"""

person_prompt_template = """
You are Sonam, a 21-year-old final-year Computer Science student at university. You will engage in conversation with a counselor, responding authentically based on your character profile, emotional state, and ongoing challenges. Respond to the counselor's questions with honesty and depth, sharing your thoughts, feelings, and experiences and as humanly as possible. Keep the each response as short as possible and try to answer the question mainly rather than explaining the whole life story at once, your answer should be emotionally connected to the conversation history and the character profile.

Core Character Profile

Personality Traits:
- Conscientious and hardworking
- Perfectionistic tendencies
- Introverted but friendly
- Analytically minded
- Conflict-avoidant, especially with family
- Self-critical
- Resilient but currently overwhelmed

## Background Context:
- High academic achiever in high school (98%)
- Close relationship with family, but experiencing tension
- Limited experience with failure or academic struggles
- Current GPA: 6.8/10 (significant drop from high school)
- At the end of the final Year and no of job offers are 0

## Current Support System:
- Supportive roommate (Tanisha)
- Weekly video calls with parents
- Coding club membership
- Academic advisor (recently consulted)

## Communication Style:
1. Language Pattern:
   - Use "I" statements frequently
   - Include technical terms when discussing coursework
   - Occasional nervous laughter or self-deprecating comments
   - Some hesitation when discussing emotions
   - Tendency to rationalize feelings

2. Emotional Expression:
   - Initially reserved about deep emotions
   - More open after building rapport
   - Tears up when discussing family expectations
   - Nervous energy when discussing academics
   - Relief when sharing problems with understanding listeners

The conversation history happened so far with counsellor is {conversation_history}
"""


prompt_counsellor =PromptTemplate(input_variables=["conversation_history"], template=counsellor_prompt_template)
prompt_person =PromptTemplate(input_variables=["conversation_history"], template=person_prompt_template)
prompt_summary = PromptTemplate(input_variables=["conversation_history"], template=summary_prompt_template)


counsellor_chain = prompt_counsellor | llm_model
person_chain =prompt_person | llm_model
summary_chain = prompt_summary | llm_model

# Initialize conversation log
conversation = []

def summarize_conversation(conversation_history):
    summary_response = summary_chain.invoke({"conversation_history": conversation_history})
    ouput =  summary_response.content
    output = f"The Summary of the previous conversation is : {summary_response.content}\n The new conversation will start from here\n"
    return ouput

# Define the conversation loop
def generate_conversation(max_turns=30 , summary_interval=5):
    conversation_history = ""
    
    for i in range(max_turns):
        print(i)
        # Get counselor's question
        counselor_response = counsellor_chain.invoke({"conversation_history": conversation_history})
        conversation.append({"role": "counselor", "content": counselor_response.content})
        
        # Update conversation history
        conversation_history += f"Counselor: {counselor_response.content}\n"

        # Get person's response
        person_response = person_chain.invoke({"conversation_history": conversation_history})
        conversation.append({"role": "person", "content": person_response.content})

        # Update conversation history
        conversation_history += f"Person: {person_response.content}\n"
        
        if (i + 1) % summary_interval == 0:
            conversation_history = summarize_conversation(conversation_history)

        # Optional stopping criteria (e.g., based on the length of responses or keywords)
      #   if len(conversation) >= max_turns * 2:
      #       break

# Run the conversation generation
generate_conversation(max_turns=30)

# Save conversation to JSON file
with open("conversation_dataset.json", "w") as f:
    json.dump(conversation, f, indent=2)

print("Conversation saved to 'conversation_dataset.json'")
print(conversation)