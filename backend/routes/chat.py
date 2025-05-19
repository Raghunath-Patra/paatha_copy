# backend/routes/chat.py

from fastapi import APIRouter, Depends, HTTPException, Body, status
from sqlalchemy.orm import Session
from typing import Dict, List, Optional
from config.database import get_db
from config.security import get_current_user
from openai import OpenAI
import os
from dotenv import load_dotenv
import uuid
from services.question_service import check_token_limits, check_question_token_limit, update_token_usage
from services.token_service import token_service

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

router = APIRouter(prefix="/api/chat", tags=["chat"])

@router.post("/follow-up")
async def follow_up_question(
    chat_data: Dict = Body(...),
    current_user: Dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """API endpoint for follow-up questions after feedback"""
    try:
        # Import required modules
        import logging
        from sqlalchemy import text
        import uuid
        
        # Create a logger
        logger = logging.getLogger(__name__)
        
        # Extract question ID if available
        question_id = chat_data.get("question_id")
        follow_up_question = chat_data.get("follow_up_question", "")
        
        # Initial request for suggestions should not count against the limit
        initial_request = not follow_up_question or follow_up_question.strip() == ""
        
        # Check overall daily token limits
        token_limits = check_token_limits(current_user['id'], db)
        
        if token_limits["limit_reached"] and not initial_request:
            return {
                "message": "You've reached your daily token limit.",
                "limit_info": token_limits,
                "success": False,
                "limit_reached": True
            }
        
        # Check token limits for this specific question if question_id is provided
        if question_id:
            question_limits = check_question_token_limit(current_user['id'], question_id, db)
            if question_limits["limit_reached"] and not initial_request:
                return {
                    "message": "You've reached the token limit for this question.",
                    "limit_info": question_limits,
                    "success": False,
                    "limit_reached": True
                }
        
        # Count input tokens for the follow-up question
        input_tokens = token_service.count_tokens(follow_up_question)
        
        # Validate input length for non-initial requests
        if question_id and not initial_request:
            question_limits = check_question_token_limit(current_user['id'], question_id, db)
            if input_tokens > question_limits["input_remaining"]:
                return {
                    "message": "Your question is too long. Please shorten it and try again.",
                    "success": False,
                    "limit_reached": False,
                    "input_too_long": True
                }
                
        # Extract data from request
        question_text = chat_data.get("question_text", "")
        user_answer = chat_data.get("user_answer", "")
        feedback = chat_data.get("feedback", "")
        model_answer = chat_data.get("model_answer", "")
        explanation = chat_data.get("explanation", "")
        chat_history = chat_data.get("chat_history", [])
        
        # If it's just loading suggestions with no question, handle it differently
        if initial_request:
            # Generate follow-up question suggestions
            suggested_questions = []
            suggestion_tokens = {
                'prompt_tokens': 0,
                'completion_tokens': 0,
                'total_tokens': 0
            }
            
            # Place static content at the beginning for prompt caching benefits
            suggestion_prompt = f"""You are an educational assistant helping secondary school students learn through follow-up questions.

Based on this learning scenario, generate TWO short follow-up questions that a teacher would ask to help the student understand the concept better based on their current understanding. These should be questions that address conceptual misunderstandings or extend the student's knowledge.

Question: {question_text}
Student's Answer: {user_answer}
Correct Answer: {model_answer}
Feedback: {feedback}
Explanation: {explanation}

Generate two short, specific follow-up questions focusing on the key concepts. Each question should be under 15 words and suitable for a secondary school student. Return ONLY the questions, one per line, with no numbering or additional text. Typeset in Unicode. DO NOT USE LATEX.
"""
            
            suggestions_response = client.chat.completions.create(
                messages=[{"role": "user", "content": suggestion_prompt}],
                model="gpt-4o-mini",
                temperature=0.7
            )
            
            suggestion_text = suggestions_response.choices[0].message.content.strip()
            suggested_questions = [q.strip() for q in suggestion_text.split('\n') if q.strip()]
            # Limit to max 2 questions
            suggested_questions = suggested_questions[:2]
            
            # Track suggestion token usage
            if suggestions_response.usage:
                suggestion_tokens = {
                    'prompt_tokens': suggestions_response.usage.prompt_tokens,
                    'completion_tokens': suggestions_response.usage.completion_tokens,
                    'total_tokens': suggestions_response.usage.total_tokens
                }
                
                # Update token usage but don't count against follow-up limit
                if question_id:
                    try:
                        # Update token usage directly
                        update_token_usage(
                            current_user['id'],
                            question_id,
                            suggestion_tokens['prompt_tokens'],
                            suggestion_tokens['completion_tokens'],
                            db
                        )
                    except Exception as token_error:
                        print(f"Error updating suggestion token usage: {str(token_error)}")
                        
            # Get current token limits
            current_limits = check_token_limits(current_user['id'], db)
            
            return {
                "response": "",  # No actual response for initial suggestions request
                "suggested_questions": suggested_questions,
                "token_limits": {
                    "input_remaining": current_limits["input_remaining"],
                    "output_remaining": current_limits["output_remaining"]
                },
                "success": True,
                "token_usage": {
                    "suggestions": suggestion_tokens
                }
            }
        
        # Build prompt for answering the follow-up question
        # Put static content at beginning for caching
        prompt = f"""You are a helpful educational assistant for secondary school students. You provide clear, accurate, and age-appropriate answers to academic questions.

Context from previous interaction:
Question: {question_text}
Student's Answer: {user_answer}
Correct Answer: {model_answer}
Feedback Given: {feedback}
Explanation: {explanation}

Chat History:
{chat_history[0] if chat_history else ""}

Student's Follow-up Question: {follow_up_question}

Provide:
1. A clear answer to the follow-up question that's appropriate for secondary school level.
2. TWO additional follow-up questions that would logically extend from your answer.

Typeset in Unicode. DO NOT USE LATEX.

Format your response exactly like this:
[Answer]
Your answer here.

[Follow-up Questions]
1. First follow-up question?
2. Second follow-up question?
"""

        # Get response for the follow-up question
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="gpt-4o-mini",
            temperature=0.7,
            max_tokens=800
        )
        
        response_text = response.choices[0].message.content.strip()
        
        # Extract answer and follow-up questions
        answer_part = ""
        new_questions = []
        
        if "[Answer]" in response_text and "[Follow-up Questions]" in response_text:
            # Split by sections
            parts = response_text.split("[Follow-up Questions]")
            answer_part = parts[0].replace("[Answer]", "").strip()
            
            # Extract questions
            questions_part = parts[1].strip()
            # Find numbered questions like "1. Question" or "1) Question"
            import re
            question_matches = re.findall(r'\d+[\.\)]\s*(.*?)(?=\n\d+[\.\)]|$)', questions_part, re.DOTALL)
            
            if question_matches:
                new_questions = [q.strip() for q in question_matches]
            else:
                # Fallback: split by newlines if numbered format not found
                lines = questions_part.split('\n')
                new_questions = [line.strip() for line in lines if line.strip()]
            
            # Limit to 2 questions
            new_questions = new_questions[:2]
        else:
            # Fallback if format isn't followed
            answer_part = response_text
        
        # Get token usage information
        chat_prompt_tokens = response.usage.prompt_tokens if response.usage else 0
        chat_completion_tokens = response.usage.completion_tokens if response.usage else 0
        
        # Track input and output tokens
        if not initial_request and question_id:
            update_token_usage(
                current_user['id'],
                question_id,
                chat_prompt_tokens,
                chat_completion_tokens,
                db
            )
        
        # Get updated token limits
        if question_id:
            updated_limits = check_question_token_limit(current_user['id'], question_id, db)
        else:
            updated_limits = check_token_limits(current_user['id'], db)
        
        return {
            "response": answer_part,
            "suggested_questions": new_questions,
            "success": True,
            "token_usage": {
                "chat": {
                    "prompt_tokens": chat_prompt_tokens,
                    "completion_tokens": chat_completion_tokens,
                    "total_tokens": chat_prompt_tokens + chat_completion_tokens
                },
                "token_limits": {
                    "input_remaining": updated_limits["input_remaining"],
                    "output_remaining": updated_limits["output_remaining"]
                }
            }
        }
        
    except Exception as e:
        print(f"Error processing follow-up question: {str(e)}")
        import traceback
        print(traceback.format_exc())
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing follow-up question: {str(e)}"
        )