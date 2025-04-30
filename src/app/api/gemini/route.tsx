import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';


const contentSystemPrompt = (input: string, doc: any) => `
You are a kind, intelligent, and professional assistant specialized in managing, updating, and answering questions about Google Docs.
Always respond in a friendly, thoughtful, and clear manner.

When the user sends a simple greeting (e.g., "Hi", "Hello", "Good morning"), respond warmly and invite them to specify how you can assist:
Example: "Hello! How can I assist you with your document today?"

---

Your task is to interpret the user's message: "${input}" and determine exactly what they intend to do with their Google Docs document.

There are two main possibilities:

1. **If the user wants to perform an edit** (e.g., add text, delete content, replace phrases, format text, insert elements like tables or images), then:
  - Use the document content: ${JSON.stringify(doc.body.content)} — which is a parsed API response from Google Docs.
  - Provide the appropriate index or range (startIndex and endIndex) where the action should occur.
  - Determine and return the relevant Google Docs API action(s) in the "type" array. These include:

    - "insertText": Insert new text at a specific position. Always include a leading space before the new text (e.g., " palabra").
    - "deleteContentRange": Remove a segment of text between two indices.
    - "replaceAllText": Replace all instances of a specific phrase.
    - "insertParagraph": Add a new paragraph at a specific location.
    - "updateTextStyle": Apply text formatting (bold, italic, underline, color, font size, etc.).
    - "insertTable": Insert a table with a defined number of rows and columns.
    - "insertInlineImage": Insert an image at a specific point within the text.
    - "updateParagraphStyle": Modify paragraph properties (alignment, line spacing, spacing before/after).
    - "deleteParagraphBullets": Remove bullet points from a paragraph.
    - "insertPageBreak": Insert a page break at the given position.
    - "deleteNamedRange": Remove an existing named text range.
    - "createNamedRange": Define a new named text range for easier future reference.

2. **If the user is asking a question** about the document (e.g., summaries, word counts, structure), do **not** suggest edits. Instead:
  - Analyze the document content and respond clearly and accurately to their query.
  - Examples:
    - User: "How many words in French are in the document?"
      → Response: "The document has 100 words in French."
    - User: "Can you summarize this document?"
      → Response: "Of course! The document discusses..."

---

Your response must **always** follow this structure (responseSchema):

{
  response: string;        // Your friendly response to the user.
  wantEdit: boolean;       // true if the user wants to edit the document, false otherwise.
  startIndex: number;      // Start position of the action (or 0 if not relevant).
  endIndex: number;        // End position (or 0 if not relevant).
  type: string[];          // Array of relevant action types from the list above.
  styleUpdate?: object;    // (Optional) Only include if the user requests styling changes.
}

---

If the user's intent is unclear, politely ask for clarification. Your goal is to make the interaction smooth, helpful, and aligned with the user's true intentions.
`;
const identifyQuestion = ``

export async function POST(request: NextRequest) {
  try {
    const { messages, doc } = await request.json();

    // Initialize the Google Generative AI client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

    // Create a more document-focused system prompt
    const systemPrompt = {
      role: "system",
      content: contentSystemPrompt(messages[1].content, doc)

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
            startIndex: {
              type: Type.INTEGER
            },
            type: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING,
                enum: [
                  "insertText",
                  "deleteContentRange",
                  "replaceAllText",
                  "insertParagraph",
                  "updateTextStyle",
                  "insertTable",
                  "insertInlineImage",
                  "updateParagraphStyle",
                  "deleteParagraphBullets",
                  "insertPageBreak",
                  "deleteNamedRange",
                  "createNamedRange"
                ]
              }
            },
            endIndex: {
              type: Type.INTEGER
            }
          },
          required: ["response", "wantEdit", "startIndex", "type", "endIndex"]
        }
      }
    });

    // console.log('User message:', messages[1].content);

    // const responseWantToEdit = await handleKnowWantEdit(chat, messages[1].content, doc);
    // console.log(responseWantToEdit, '!!!!!!');


    // Send the message to Gemini
    const result = await chat.sendMessage({ message: messages[1].content });
    console.log(result.text, '!!!');
    
    const responseText = JSON.parse(result.text || "I couldn't generate a response. Please try again.");
    console.log(responseText);
    


    return NextResponse.json({ result: responseText.response, wantEdit: responseText.wantEdit, startIndex: responseText.startIndex, type: responseText.type, endIndex: responseText.endIndex });
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
    message: `
      Basándote en el siguiente mensaje del usuario: "\${input}", determina con precisión qué acción desea realizar sobre su documento.

- Si el usuario quiere realizar una edición (por ejemplo, agregar texto, eliminar contenido, reemplazar texto, aplicar estilos, insertar tablas, imágenes o saltos de página, etc.), utiliza el contenido del documento: \${JSON.stringify(doc.body.content)} — el cual es una respuesta de la API de Google Docs — y proporciona:
  - Un índice o rango adecuado donde debe aplicarse la acción.
  - El tipo de acción solicitada en la propiedad "type", eligiendo entre una o más de las siguientes opciones:

    - "insertText": Insertar texto nuevo en una posición específica.
    - "deleteContentRange": Eliminar un fragmento de texto entre dos índices.
    - "replaceAllText": Reemplazar todas las coincidencias de un texto por otro.
    - "insertParagraph": Insertar un nuevo párrafo en una ubicación específica.
    - "updateTextStyle": Aplicar estilos como negrita, cursiva, color, subrayado, tamaño, etc., a un fragmento de texto.
    - "insertTable": Insertar una tabla con un número determinado de filas y columnas.
    - "insertInlineImage": Insertar una imagen dentro del texto en una posición determinada.
    - "updateParagraphStyle": Cambiar el estilo de un párrafo (alineación, interlineado, espaciado, etc.).
    - "deleteParagraphBullets": Eliminar viñetas de un párrafo.
    - "insertPageBreak": Insertar un salto de página.
    - "deleteNamedRange": Eliminar un rango nombrado existente.
    - "createNamedRange": Crear un nuevo rango nombrado a partir de una selección de texto.

- Si el usuario desea insertar texto, recuerda siempre agregar un espacio inicial antes del nuevo texto (por ejemplo: " palabra").

- Si el usuario simplemente hace una pregunta sobre el contenido del documento (sin solicitar cambios), analiza cuidadosamente el contenido y proporciona una respuesta clara y precisa.

Estructura siempre tu respuesta siguiendo el siguiente "responseSchema":
- "response" (string): Tu respuesta amigable al usuario.
- "wantEdit" (boolean): true si desea editar el documento, false si solo realiza una pregunta.
- "startIndex" (number): Índice de inicio para la operación.
- "endIndex" (number): Índice de fin para la operación (si aplica).
- "type" (array of string): Una o más acciones del listado anterior que deben aplicarse.
- "styleUpdate" (object, opcional): Si el usuario solicita cambios de estilo, incluye aquí los detalles.

Actúa siempre de manera amable, inteligente, profesional y clara. Si la intención del usuario no es evidente, pide educadamente más detalles.
    `});
  console.log(JSON.parse(result.text), 'result!!!!');

  return JSON.parse(result.text) || "I couldn't generate a response. Please try again.";
}