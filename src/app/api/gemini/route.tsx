
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();
    
    const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY || ""});
    const chat = ai.chats.create({
        model: "gemini-2.0-flash",
        history: messages[0]
    });
    console.log('messages', messages[1])
    const result = await chat.sendMessage({message: messages[1].content});
    
    return NextResponse.json({ result: result.text });
  } catch (error) {
    console.error('Error in Gemini API:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}