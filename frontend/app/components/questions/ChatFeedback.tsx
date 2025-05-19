// frontend/app/components/questions/ChatFeedback.tsx
import React, { useState, useRef, useEffect } from 'react';
import { getAuthHeaders } from '../../utils/auth';
import { Send, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import TokenLimitWarning from '../common/TokenLimitWarning'; // Import TokenLimitWarning

interface ChatFeedbackProps {
  questionText: string;
  userAnswer: string;
  feedback: string;
  modelAnswer: string;
  explanation: string;
  transcribedText?: string;
  questionId: string;
  initialQuestion?: string; // New prop for the initially selected question
}

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

const ChatFeedback: React.FC<ChatFeedbackProps> = ({
  questionText,
  userAnswer,
  feedback,
  modelAnswer,
  explanation,
  transcribedText,
  questionId,
  initialQuestion = '' // Default to empty string
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [remainingQuestions, setRemainingQuestions] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTokenWarning, setShowTokenWarning] = useState(false); // Add state for token warning
  const [isPremium, setIsPremium] = useState(false); // Track premium status
  const chatEndRef = useRef<HTMLDivElement>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const initialLoadDone = useRef(false);
  const router = useRouter();

  // Scroll to bottom whenever messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check premium status
  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const { headers, isAuthorized } = await getAuthHeaders();
        if (!isAuthorized) return;
        
        const response = await fetch(`${API_URL}/api/user/token-status`, { headers });
        if (response.ok) {
          const data = await response.json();
          setIsPremium(data.plan_name === 'premium');
        }
      } catch (error) {
        console.error('Error checking user status:', error);
      }
    };
    
    checkUserStatus();
  }, [API_URL]);

  // Handle initial question if provided
  useEffect(() => {
    if (initialQuestion && !initialLoadDone.current) {
      initialLoadDone.current = true;
      handleSendMessage(initialQuestion);
    } else if (!initialQuestion && !initialLoadDone.current) {
      // If no initial question, fetch suggested questions
      fetchSuggestedQuestions();
      initialLoadDone.current = true;
    }
  }, [initialQuestion]);

  const fetchSuggestedQuestions = async () => {
    try {
      setIsLoading(true);
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }

      const response = await fetch(`${API_URL}/api/chat/follow-up`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_text: questionText,
          user_answer: userAnswer,
          feedback,
          model_answer: modelAnswer,
          explanation,
          transcribed_text: transcribedText,
          follow_up_question: "", // No initial question
          chat_history: [],
          question_id: questionId
        })
      });

      if (response.status === 402) {
        setError("You've reached your daily usage limit. Please upgrade to Premium for more follow-up questions or try again tomorrow.");
        setLimitReached(true);
        setShowTokenWarning(true); // Show token warning
        return;
      }

      const data = await response.json();
      
      if (data.success) {
        setSuggestedQuestions(data.suggested_questions || []);
        setRemainingQuestions(data.remaining);
      } else {
        setError(data.message || "Could not load suggested questions");
        if (data.limit_reached) {
          setLimitReached(true);
          if (data.daily_limit_reached) {
            setShowTokenWarning(true); // Show token warning for daily limit
          }
        }
      }
    } catch (err) {
      console.error('Error fetching suggested questions:', err);
      setError('Could not load suggested questions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (messageText: string = newMessage) => {
    if ((!messageText.trim() && !newMessage.trim()) || isLoading || limitReached) return;
    
    const userMessage = messageText.trim() || newMessage.trim();
    
    // Immediately add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setNewMessage(''); // Clear input field
    setSuggestedQuestions([]); // Clear suggested questions after use
    
    try {
      setIsLoading(true);
      
      const { headers, isAuthorized } = await getAuthHeaders();
      if (!isAuthorized) {
        router.push('/login');
        return;
      }
      // Prepare chat history
      const chatHistory = messages.map(msg => msg.content);
      const response = await fetch(`${API_URL}/api/chat/follow-up`, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_text: questionText,
          user_answer: userAnswer,
          feedback,
          model_answer: modelAnswer,
          explanation,
          transcribed_text: transcribedText,
          follow_up_question: userMessage,
          chat_history: chatHistory,
          question_id: questionId
        })
      });
      
      // This handles the 402 Payment Required response (daily limit)
      if (response.status === 402) {
        // Only add the message to the chat - don't set error separately
        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: "You've reached your daily usage limit. Please upgrade to Premium for more follow-up questions or try again tomorrow." 
          }
        ]);
        
        setLimitReached(true);
        setRemainingQuestions(0);
        setShowTokenWarning(true); // Show token warning
        
        return;
      }
      
      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        
        if (data.suggested_questions?.length > 0) {
          setSuggestedQuestions(data.suggested_questions);
        }
        
        if (data.remaining !== undefined) {
          setRemainingQuestions(data.remaining);
          setLimitReached(data.remaining <= 0);
        }
      } else {
        // Handle other errors like per-question limits
        if (data.limit_reached) {
          if (data.daily_limit_reached) {
            // For daily limit, set token warning and add message to chat
            setShowTokenWarning(true);
            
            // Add to messages so it shows in the chat
            setMessages(prev => [
              ...prev, 
              { 
                role: 'assistant', 
                content: "You've reached your daily usage limit. Please upgrade to Premium or try again tomorrow."
              }
            ]);
            
            // Don't set the error state since we're showing the message in the chat
          } else {
            // For per-question limit, only add the message to the chat once
            setMessages(prev => [
              ...prev, 
              { 
                role: 'assistant', 
                content: "You've reached the usage limit for this question. Try answering a new question."
              }
            ]);
          }
          
          setLimitReached(true);
        } else {
          setError(data.message || "Could not send message");
        }
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-4">
      <h3 className="font-medium text-lg mb-3">Ask follow-up questions about this answer</h3>
      
      {/* Display token warning at the top of chat */}
      {showTokenWarning && (
        <TokenLimitWarning 
          isVisible={showTokenWarning}
          onClose={() => setShowTokenWarning(false)}
          isPremium={isPremium}
        />
      )}

      <div className="flex flex-col overflow-hidden">
        {/* Messages display */}
        {messages.length > 0 && (
          <div className="bg-neutral-50 rounded-lg p-3 mb-3 max-h-64 overflow-y-auto">
            <div className="space-y-3">
              {messages.map((message, index) => {
                // Check if this is a limit message
                const isLimitMessage = message.role === 'assistant' && (
                  message.content.includes("You've reached the usage limit for this question") ||
                  message.content.includes("You've reached your daily usage limit")
                );
                
                return (
                  <div 
                    key={index}
                    className={`p-2 rounded-lg ${
                      message.role === 'user' 
                        ? 'bg-blue-50 ml-4 text-neutral-800' 
                        : isLimitMessage
                          ? 'bg-red-50 mr-4 text-red-600' // Red styling for limit messages
                          : 'bg-neutral-100 mr-4 text-neutral-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                  </div>
                );
              })}
              {isLoading && (
                <div className="bg-neutral-100 rounded-lg p-2 mr-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-neutral-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} id="chat-end-ref" />
            </div>
          </div>
        )}
        
        {/* Suggested questions */}
        {suggestedQuestions.length > 0 && !limitReached && (
          <div className="flex flex-wrap gap-2 mb-3">
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                className="bg-blue-50 py-1 px-3 rounded-full text-sm hover:bg-blue-100 text-blue-700 transition-colors"
                disabled={isLoading || limitReached}
              >
                {question}
              </button>
            ))}
          </div>
        )}
        
        {/* Remaining questions indicator - only show if there's a limit */}
        {remainingQuestions !== null && (
          <div className="text-xs text-neutral-500 mb-2">
            {limitReached 
              ? 'You have reached the follow-up question limit for this answer' 
              : `${remainingQuestions} follow-up questions remaining for this answer`}
          </div>
        )}
        
        {/* Error message */}
        {error && !showTokenWarning && (
          <div className="bg-red-50 text-red-600 p-2 rounded mb-2 text-sm">
            {error}
          </div>
        )}
        
        {/* Input area */}
        <div className="flex items-center">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={limitReached ? "Follow-up limit reached" : "Type your follow-up question..."}
            className="flex-1 p-2 border rounded-l focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading || limitReached}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!newMessage.trim() || isLoading || limitReached}
            className="bg-blue-600 text-white p-2 rounded-r hover:bg-blue-700 disabled:opacity-50"
          >
            {isLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatFeedback;