// src/app/components/chat.tsx
import { useState, useEffect } from 'react'

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface ChatProps {
  docId: string;
  doc: any;
  fetchSheetData?: () => Promise<void>;
  isSheets: boolean;
}

export const Chat = ({docId, doc, fetchSheetData, isSheets}: ChatProps) => {
  console.log('doc', doc);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'user', content: 'Be my assistant to manage and update this document: ' + doc.title },
  ]);
  const [cell, setCell] = useState('');
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [updateText, setUpdateText] = useState('');
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [indexToInsertText, setIndexToInsertText] = useState(null);
  const [dataToSendToDocs, setDataToSendToDocs] = useState({});

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    const cellRegex = /\b[A-Z]+[0-9]+\b(?::\b[A-Z]+[0-9]+\b)?/;
    setCell(cellRegex.exec(input)?.[0] || '');
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
          doc: doc
        }),
      });
      
      const data = await response.json();
      
      // Add assistant response to chat
      const modelResponse: Message = { 
        role: 'model', 
        content: data.result 
      };
      setMessages(prev => [...prev, modelResponse]);
      
      // Check if the response contains text that looks like it's suggesting an update
      if (data.wantEdit) {
        setShowUpdateForm(true);
        setDataToSendToDocs(data);
        
        // Try to extract potential text to update
        const potentialText = extractUpdateText(data.result);
        if (potentialText) {
          setUpdateText(potentialText);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to extract potential update text from the model's response
  const extractUpdateText = (text: string): string => {
    // Look for text between quotes
    const quoteMatch = text.match(/"([^"]+)"/);
    if (quoteMatch && quoteMatch[1]) return quoteMatch[1];
    
    // Look for text after phrases like "add the following:"
    const followingMatch = text.match(/(?:add|update|insert|change to|with)(?:\s+the)?(?:\s+following)?(?:\s+text)?(?:\s*:+\s*)([^.!?]+)/i);
    if (followingMatch && followingMatch[1]) return followingMatch[1].trim();
    return '';
  };

  // Function to update the document
  const handleUpdateDocument = async () => {
    if (!updateText.trim()) return;
    
    setIsUpdating(true);
    try {
      const index = indexToInsertText ? indexToInsertText - 1 : 1;
      const res = await fetch(`/api/docs/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: updateText,
          data: dataToSendToDocs 
        }),
      });

      const data = await res.json();
      
      // Add a message to indicate the update was successful
      setMessages(prev => [...prev, { 
        role: 'model' as const, 
        content: `✅ Document updated successfully with: "${updateText}"` 
      }]);
      
      // Reset the update form
      setUpdateText('');
      setShowUpdateForm(false);
      
      // Inform the user that they might need to refresh to see changes
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'model' as const, 
          content: 'Note: You may need to refresh the document view to see the changes.' 
        }]);
      }, 1000);
      
    } catch (error) {
      console.error('Error updating document:', error);
      setMessages(prev => [...prev, { 
        role: 'model' as const, 
        content: '❌ Failed to update the document. Please try again.' 
      }]);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateSheets = async () => {
    let values: string[][] = [];

    setIsUpdating(true);

    try {

      let values = [];

    if (cell.includes(':')) {
      const [start, end] = cell.split(':');
      const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
      const endRow = parseInt(end.match(/\d+/)?.[0] || '0');
      const numRows = endRow - startRow + 1;

      values = Array.from({ length: numRows }, () => [updateText]);
    } else {
      values = [[updateText]];
    }

      const res = await fetch(`/api/sheets/${docId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: docId,
          range: `'Hoja 1'!${cell}`,
          values: values,
        }),
      });
  
      const json = await res.json();
      console.log('Respuesta write:', json);
      // setInputValue('');
      fetchSheetData?.();
      
      // Add a message to indicate the update was successful
      setMessages(prev => [...prev, { 
        role: 'model' as const, 
        content: `✅ Sheet updated successfully with: "${updateText}"` 
      }]);
      
      // Reset the update form
      setUpdateText('');
      setShowUpdateForm(false);
      
      // Inform the user that they might need to refresh to see changes
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'model' as const, 
          content: 'Note: You may need to refresh the sheet view to see the changes.' 
        }]);
      }, 1000);
    } catch (error) {
      console.error('Error updating sheet:', error);
      setMessages(prev => [...prev, { 
        role: 'model' as const, 
        content: '❌ Failed to update the sheet. Please try again.' 
      }]);
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <div className="flex flex-col max-h-screen overflow-y-auto overflow-x-hidden border rounded-md">
      <div className=" p-4 overflow-y-auto">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 p-3 rounded-lg text-black ${
              message.role === 'user' 
                ? 'bg-blue-100 w-[80%] ml-auto' 
                : 'bg-gray-100 w-[80%] mr-auto'
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
        
        {showUpdateForm && (
          <div className="mb-4 p-4 border border-blue-300 rounded-lg text-black bg-blue-50">
            <h3 className="font-medium mb-2">Update Document</h3>
            <textarea
              value={updateText}
              onChange={(e) => setUpdateText(e.target.value)}
              placeholder="Enter text to add to the document..."
              className="w-full border rounded-md p-2 mb-2"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button 
                onClick={() => setShowUpdateForm(false)}
                className="px-3 py-1 border rounded-md"
              >
                Cancel
              </button>
              <button 
                onClick={isSheets ? handleUpdateSheets : handleUpdateDocument}
                disabled={isUpdating || !updateText.trim()}
                className="bg-blue-500 text-black px-3 py-1 rounded-md disabled:bg-blue-300 flex items-center"
              >
                {isUpdating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    Updating...
                  </>
                ) : 'Update Document'}
              </button>
            </div>
          </div>
        )}
      </div>
      <div className="border-t p-3 flex">
        <textarea
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