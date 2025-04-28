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
            },
            index: {
              type: Type.INTEGER
            }
          },
          required: ["response", "wantEdit", "index"]
        }
      }
    });

    // console.log('User message:', messages[1].content);

    const responseWantToEdit = await handleKnowWantEdit(chat, messages[1].content, doc);
    console.log(responseWantToEdit, '!!!!!!');


    // Send the message to Gemini
    // const result = await chat.sendMessage({message: messages[1].content});
    // const responseText = responseWantToEdit|| "I couldn't generate a response. Please try again.";


    return NextResponse.json({ result: responseWantToEdit.response, wantEdit: responseWantToEdit.wantEdit, index: responseWantToEdit.index });
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
    message: `Basándote en el siguiente mensaje: "${input}", determina si el usuario quiere editar el documento o simplemente recibir una respuesta sobre su documento.

      Si tu respuesta es "Sí" (es decir, el usuario quiere editar el documento), utiliza el siguiente contenido del documento: ${JSON.stringify(doc.body.content)} — esta es una respuesta de la API de Google Docs — y proporciona un índice adecuado donde se debería insertar el nuevo texto del usuario quiero siempre le agregues un espacio al incio por ejemplo: " palabra".

  Si tu respuesta es "No" (es decir, el usuario está haciendo una pregunta sobre el documento), analiza cuidadosamente el contenido del documento y proporciona una respuesta clara y precisa a la pregunta del usuario.
    `});
  console.log(JSON.parse(result.text), 'result!!!!');

  return JSON.parse(result.text) || "I couldn't generate a response. Please try again.";
}