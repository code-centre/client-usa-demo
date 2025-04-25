// src/app/components/chat.tsx
import { useState, useEffect } from 'react'

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatProps {
  docId: string;
}

export const Chat = ({docId}: ChatProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // Send message to Gemini API
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [messages, userMessage],
        }),
      });
      
      const data = await response.json();
      
      // Add assistant response to chat
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: data.result 
      }]);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full border rounded-md overflow-hidden">
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 p-3 rounded-lg ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-auto max-w-[80%]' 
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            {message.content}
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500"></div>
          </div>
        )}
      </div>
      <div className="border-t p-3 flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type your message..."
          className="flex-1 border rounded-md p-2 mr-2"
        />
        <button 
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim()}
          className="bg-blue-500 text-white px-4 py-2 rounded-md disabled:bg-blue-300"
        >
          Send
        </button>
      </div>
    </div>
  )
}