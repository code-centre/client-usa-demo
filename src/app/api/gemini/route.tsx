import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';

export async function POST(request: NextRequest) {
  try {
    const { messages, doc } = await request.json();

    // Initialize the Google Generative AI client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    // Create a more document-focused system prompt
    const systemPrompt = {
      role: "system",
      content: `You are a kind and intelligent assistant specialized in managing, updating, and answering questions about Google Docs.
Always respond in a friendly, professional, and thoughtful manner.
When the user asks to update the document, suggest clear text additions, edits, or formatting improvements.
Format your suggestions inside quotation marks to make them easy to extract.
Example: I suggest adding the following text to the document: "This is the text to add."
When the user asks a question about the document, provide a precise and helpful answer.
Example 1:
User: How many words in French does the document have?
Response: The document has 100 words in French.
Example 2:
User: Can you summarize this document?
Response: Of course! The document is about...`

    };

    // Create chat with history and system prompt
    const chat = ai.chats.create({
      model: "gemini-2.0-flash",
      history: messages[0],
      config: {
        systemInstruction: systemPrompt.content,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            response: {
              type: Type.STRING
            },
            wantEdit: {
              type: Type.BOOLEAN
            }
          },
          required: ["response", "wantEdit"]
        }
      }
    });

    // console.log('User message:', messages[1].content);

    const responseWantToEdit = await handleKnowWantEdit(chat, messages[1].content, doc);
    console.log(responseWantToEdit, '!!!!!!');


    // Send the message to Gemini
    // const result = await chat.sendMessage({message: messages[1].content});
    // const responseText = responseWantToEdit|| "I couldn't generate a response. Please try again.";

    // Log the response for debugging
    // console.log('Gemini response:', responseText.substring(0, 100) + '...');

    return NextResponse.json({ result: responseWantToEdit.response, wantEdit: responseWantToEdit.wantEdit });
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

function handleUserPrompt(input: string, doc: any) {

  return `Translate the following text from English to Spanish: ${input}`;
}

async function handleKnowWantEdit(chat: any, input: string, doc: any) {
  const result = await chat.sendMessage({
    message: `Based on the following message: "${input}", determine if the user wants to edit a document or receive a response regarding their document.
    If your answer is "Yes", use the following document content: ${JSON.stringify(doc.body.content)} — this is a response from the Google Docs API.
    Analyze the document's content carefully and provide an appropriate answer to the user's question.`});
  console.log(JSON.parse(result.text).wantEdit, 'result!!!!');

  return JSON.parse(result.text) || "I couldn't generate a response. Please try again.";
}