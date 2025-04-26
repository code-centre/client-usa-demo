import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    // Initialize the Google Generative AI client
    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || ""});
    
    // Create a more document-focused system prompt
    const systemPrompt = {
      role: "system",
      content: `You are a helpful assistant specialized in helping users manage and update Google Docs.
      When the user asks to update the document, provide clear suggestions for what text to add.
      Format your suggestions in quotes to make them easy to extract.
      For example: I suggest adding the following text to the document: "This is the text to add."
      You can also suggest edits, additions, or formatting changes.`
    };
    
    // Create chat with history and system prompt
    const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        history: messages[0],
        config: {
            systemInstruction: systemPrompt.content
        }
    });
    
    console.log('User message:', messages[1].content);
    
    // Send the message to Gemini
    const result = await chat.sendMessage({message: messages[1].content});
    const responseText = result.text || "I couldn't generate a response. Please try again.";
    
    // Log the response for debugging
    console.log('Gemini response:', responseText.substring(0, 100) + '...');
    
    return NextResponse.json({ result: responseText });
  } catch (error: any) {
    console.error('Error in Gemini API:', error);
    
    // Provide more detailed error information
    const errorMessage = error.message || 'Unknown error occurred';
    const errorDetails = error.details || {};
    
    return NextResponse.json(
      { 
        error: 'Failed to process request', 
        message: errorMessage,
        details: errorDetails
      },
      { status: 500 }
    );
  }
}