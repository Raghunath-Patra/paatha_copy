# services/question_service.py
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from fastapi import HTTPException
import logging
from .token_service import token_service
from .subscription_service import subscription_service

logger = logging.getLogger(__name__)

def get_india_time():
    """Get current datetime in India timezone (UTC+5:30)"""
    utc_now = datetime.utcnow()
    offset = timedelta(hours=5, minutes=30)  # IST offset from UTC
    return utc_now + offset

def get_india_date():
    """Get current date in India timezone"""
    india_time = get_india_time()
    return india_time.date()

def check_question_limit(user_id: str, db: Session):
    """
    Required function - now uses token-based limits rather than question counts
    Returns: dict with token-based limits
    """
    try:
        # Check token limits for this user
        token_limits = check_token_limits(user_id, db)
        
        # Return token-based information
        return {
            "plan_name": token_limits["plan_name"],
            "display_name": token_limits["display_name"],
            "input_limit": token_limits["input_limit"],
            "output_limit": token_limits["output_limit"],
            "input_used": token_limits["input_used"],
            "output_used": token_limits["output_used"],
            "input_remaining": token_limits["input_remaining"],
            "output_remaining": token_limits["output_remaining"],
            "questions_used_today": token_limits["questions_used_today"],
            "is_premium": token_limits["plan_name"] == "premium",
            "limit_reached": token_limits["limit_reached"]
        }
    except Exception as e:
        logger.error(f"Error in check_question_limit: {e}")
        # Return default response
        return {
            "plan_name": "free",
            "display_name": "Free Plan",
            "input_limit": 18000,
            "output_limit": 12000,
            "input_used": 0,
            "output_used": 0,
            "input_remaining": 18000,
            "output_remaining": 12000,
            "questions_used_today": 0,
            "is_premium": False,
            "limit_reached": False
        }
    
    
def check_token_limits(user_id: str, db: Session):
    """
    Check a user's daily token limits
    Returns: dict with token usage information
    """
    try:
        # Get current date in India timezone
        current_date = get_india_date()
        
        # Get plan details
        plan_name = subscription_service.get_user_subscription_plan_name(db, user_id)
        plan = subscription_service.get_plan_details(db, plan_name)
        
        # Get current token usage
        user_query = text("""
            SELECT 
                questions_used_today,
                daily_input_tokens_used, 
                daily_output_tokens_used,
                tokens_reset_date,
                token_bonus  -- Added to get token bonus
            FROM subscription_user_data
            WHERE user_id = :user_id
        """)
        
        result = db.execute(user_query, {"user_id": user_id}).fetchone()
        
        if not result:
            # Create user subscription data if it doesn't exist
            insert_query = text("""
                INSERT INTO subscription_user_data 
                (id, user_id, plan_id, questions_used_today, daily_input_tokens_used, daily_output_tokens_used, tokens_reset_date, token_bonus)
                VALUES (gen_random_uuid(), :user_id, 
                    (SELECT id FROM subscription_plans WHERE name = :plan_name LIMIT 1),
                    0, 0, 0, :current_date, 0)
                ON CONFLICT (user_id) DO NOTHING
                RETURNING questions_used_today, daily_input_tokens_used, daily_output_tokens_used, tokens_reset_date, token_bonus
            """)
            
            try:
                result = db.execute(insert_query, {
                    "user_id": user_id, 
                    "plan_name": plan_name,
                    "current_date": current_date
                }).fetchone()
                db.commit()
            except Exception as e:
                logger.error(f"Error creating subscription data: {e}")
                db.rollback()
            
            # If still no result, use defaults
            if not result:
                return {
                    "input_limit": plan.get("daily_input_token_limit", 18000),
                    "output_limit": plan.get("daily_output_token_limit", 12000),
                    "input_used": 0,
                    "output_used": 0,
                    "input_remaining": plan.get("daily_input_token_limit", 18000),
                    "output_remaining": plan.get("daily_output_token_limit", 12000),
                    "limit_reached": False,
                    "questions_used_today": 0,
                    "plan_name": plan_name,
                    "display_name": plan.get("display_name", "Free Plan"),
                    "token_bonus": 0
                }
        
        # Add token bonus to limits if present
        token_bonus = result.token_bonus if hasattr(result, 'token_bonus') else 0
        
        # Get token usage
        input_used = result.daily_input_tokens_used or 0
        output_used = result.daily_output_tokens_used or 0
        questions_used_today = result.questions_used_today or 0
        
        # Get limits and add bonus
        input_limit = plan.get("daily_input_token_limit", 18000) + token_bonus
        output_limit = plan.get("daily_output_token_limit", 12000) + token_bonus
        
        # Calculate remaining
        input_remaining = max(0, input_limit - input_used)
        output_remaining = max(0, output_limit - output_used)
        
        # Check if a reset is needed
        tokens_reset_date = result.tokens_reset_date
        
        if tokens_reset_date and tokens_reset_date < current_date:
            # Reset tokens if date has passed
            reset_query = text("""
                UPDATE subscription_user_data
                SET 
                    daily_input_tokens_used = 0,
                    daily_output_tokens_used = 0,
                    questions_used_today = 0,
                    tokens_reset_date = :current_date
                WHERE user_id = :user_id
            """)
            
            db.execute(reset_query, {"user_id": user_id, "current_date": current_date})
            db.commit()
            
            # Reset values
            input_used = 0
            output_used = 0
            input_remaining = input_limit
            output_remaining = output_limit
            questions_used_today = 0
        
        # Determine if limit is reached based on either input or output tokens
        limit_reached = input_remaining <= 0 or output_remaining <= 0
        
        return {
            "input_limit": input_limit,
            "output_limit": output_limit,
            "input_used": input_used,
            "output_used": output_used,
            "input_remaining": input_remaining,
            "output_remaining": output_remaining,
            "limit_reached": limit_reached,
            "questions_used_today": questions_used_today,
            "plan_name": plan_name,
            "display_name": plan.get("display_name", "Free Plan"),
            "token_bonus": token_bonus  # Include token bonus in the response
        }
        
    except Exception as e:
        logger.error(f"Error checking token limits: {str(e)}")
        return {
            "input_limit": 18000,
            "output_limit": 12000,
            "input_used": 0,
            "output_used": 0,
            "input_remaining": 18000,
            "output_remaining": 12000,
            "limit_reached": False,
            "questions_used_today": 0,
            "plan_name": "free",
            "display_name": "Free Plan",
            "token_bonus": 0
        }
    
def increment_question_usage(user_id: str, db: Session):
    """
    Required function - now increments questions_used_today for display purposes only
    Returns: bool indicating if token limit has been reached
    """
    try:
        # Check current token limits
        token_limits = check_token_limits(user_id, db)
        
        # If already at limit, don't increment
        if token_limits["limit_reached"]:
            return True  # Limit reached
            
        # Increment questions_used_today for display purposes
        update_query = text("""
            UPDATE subscription_user_data
            SET questions_used_today = COALESCE(questions_used_today, 0) + 1
            WHERE user_id = :user_id
        """)
        
        db.execute(update_query, {"user_id": user_id})
        db.commit()
        
        # Return whether token limit is reached
        return token_limits["limit_reached"]
            
    except Exception as e:
        logger.error(f"Error in increment_question_usage: {e}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error updating question usage: {str(e)}")

def track_follow_up_usage(user_id: str, db: Session, question_id: str = None, increment: bool = False):
    """
    Track follow-up question based on token limits only
    """
    try:
        # Get token limits
        token_limits = check_token_limits(user_id, db)
        
        # Get the per-question token limits if question_id is provided
        if question_id:
            question_limits = check_question_token_limit(user_id, question_id, db)
            limit_reached = question_limits["limit_reached"]
            remaining = min(
                question_limits["input_remaining"],
                question_limits["output_remaining"]
            )
        else:
            # If no question_id, use overall token limits
            limit_reached = token_limits["limit_reached"]
            remaining = min(
                token_limits["input_remaining"],
                token_limits["output_remaining"]
            )
        
        return {
            "plan_name": token_limits["plan_name"],
            "display_name": token_limits["display_name"],
            "input_remaining": token_limits["input_remaining"] if question_id is None else question_limits["input_remaining"],
            "output_remaining": token_limits["output_remaining"] if question_id is None else question_limits["output_remaining"],
            "remaining": remaining,
            "limit_reached": limit_reached
        }
    except Exception as e:
        logger.error(f"Error tracking follow-up usage: {str(e)}")
        # Return sensible defaults
        return {
            "plan_name": "free",
            "display_name": "Free Plan",
            "input_remaining": 6000,
            "output_remaining": 4000,
            "remaining": 4000,
            "limit_reached": False
        }

def update_token_usage(
    user_id: str, 
    question_id: str,
    input_tokens: int, 
    output_tokens: int, 
    db: Session
):
    """Update token usage for both user data and question attempt"""
    try:
        # Start transaction
        transaction = db.begin_nested()
        
        try:
            # Update user's daily token usage
            user_update = text("""
                UPDATE subscription_user_data
                SET 
                    daily_input_tokens_used = COALESCE(daily_input_tokens_used, 0) + :input_tokens,
                    daily_output_tokens_used = COALESCE(daily_output_tokens_used, 0) + :output_tokens,
                    tokens_reset_date = COALESCE(tokens_reset_date, CURRENT_DATE)
                WHERE user_id = :user_id
            """)
            
            db.execute(user_update, {
                "user_id": user_id,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens
            })
            
            # Update the question attempt if a question ID is provided
            if question_id:
                # Find the latest attempt for this question
                find_attempt_query = text("""
                    SELECT id FROM user_attempts
                    WHERE user_id = :user_id AND question_id = :question_id
                    ORDER BY created_at DESC
                    LIMIT 1
                """)
                
                attempt_result = db.execute(find_attempt_query, {
                    "user_id": user_id,
                    "question_id": question_id
                }).fetchone()
                
                if attempt_result:
                    # Update the attempt with token usage
                    attempt_update = text("""
                        UPDATE user_attempts
                        SET 
                            input_tokens_used = COALESCE(input_tokens_used, 0) + :input_tokens,
                            output_tokens_used = COALESCE(output_tokens_used, 0) + :output_tokens
                        WHERE id = :attempt_id
                    """)
                    
                    db.execute(attempt_update, {
                        "attempt_id": attempt_result[0],
                        "input_tokens": input_tokens,
                        "output_tokens": output_tokens
                    })
            
            # Commit the transaction
            transaction.commit()
            
        except Exception as inner_error:
            transaction.rollback()
            raise inner_error
        
        # Commit the outer transaction
        db.commit()
        return True
        
    except Exception as e:
        logger.error(f"Error updating token usage: {str(e)}")
        db.rollback()
        return False


def check_question_token_limit(user_id: str, question_id: str, db: Session, reset_tokens: bool = False):
    """Check if token limit for a specific question has been reached"""
    try:
        # Get plan details
        plan_name = subscription_service.get_user_subscription_plan_name(db, user_id)
        plan = subscription_service.get_plan_details(db, plan_name)
        
        # Get per-question token limits
        input_limit = plan.get("input_tokens_per_question", 6000)
        output_limit = plan.get("output_tokens_per_question", 4000)
        
        if reset_tokens:
            # Reset token usage for this question by creating a new attempt record with zero tokens
            # This effectively resets the token counter when a question is freshly loaded
            reset_query = text("""
                UPDATE user_attempts
                SET input_tokens_used = 0, output_tokens_used = 0
                WHERE user_id = :user_id AND question_id = :question_id
            """)
            
            try:
                db.execute(reset_query, {
                    "user_id": user_id, 
                    "question_id": question_id
                })
                db.commit()
                
                # Return fresh token limits
                return {
                    "input_limit": input_limit,
                    "output_limit": output_limit,
                    "input_used": 0,
                    "output_used": 0,
                    "input_remaining": input_limit,
                    "output_remaining": output_limit,
                    "limit_reached": False
                }
            except Exception as e:
                logger.error(f"Error resetting question token usage: {str(e)}")
                db.rollback()
        
        # Check current usage for this question
        query = text("""
            SELECT 
                COALESCE(SUM(input_tokens_used), 0) as total_input,
                COALESCE(SUM(output_tokens_used), 0) as total_output
            FROM user_attempts
            WHERE user_id = :user_id AND question_id = :question_id
        """)
        
        result = db.execute(query, {
            "user_id": user_id, 
            "question_id": question_id
        }).fetchone()
        
        if not result:
            return {
                "input_limit": input_limit,
                "output_limit": output_limit,
                "input_used": 0,
                "output_used": 0,
                "input_remaining": input_limit,
                "output_remaining": output_limit,
                "limit_reached": False
            }
            
        input_used = result.total_input
        output_used = result.total_output
        
        input_remaining = max(0, input_limit - input_used)
        output_remaining = max(0, output_limit - output_used)
        
        limit_reached = input_remaining <= 0 or output_remaining <= 0
        
        return {
            "input_limit": input_limit,
            "output_limit": output_limit,
            "input_used": input_used,
            "output_used": output_used,
            "input_remaining": input_remaining,
            "output_remaining": output_remaining,
            "limit_reached": limit_reached
        }
        
    except Exception as e:
        logger.error(f"Error checking question token limit: {str(e)}")
        return {
            "input_limit": 6000,
            "output_limit": 4000,
            "input_used": 0,
            "output_used": 0,
            "input_remaining": 6000,
            "output_remaining": 4000,
            "limit_reached": False
        }