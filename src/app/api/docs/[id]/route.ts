// pages/api/docs/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getGoogleDocsClient } from '@/lib/google';
import { NextResponse } from 'next/server';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  const id = params.id;
    
  try {
    const docs = await getGoogleDocsClient();
    const doc = await docs.documents.get({ documentId: id as string });    

    return NextResponse.json(doc.data);
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ message: 'Error fetching document', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  const id = params.id;
  const body = await request.json();
  const { text, index = 1 } = body;

  if (!id || !text) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });

  try {
      const docs = await getGoogleDocsClient();

      const response = await docs.documents.batchUpdate({
          documentId: id,
          requestBody: {
              requests: [
                  {
                      insertText: {
                          location: {
                              index: index, // Insertar después del inicio
                          },
                          text: `${text}`,
                      },
                  },
              ],
          },
      });


      return NextResponse.json({ message: 'Documento actualizado', data: response.data });
  } catch (error: any) {
      console.error(error);
      return NextResponse.json({ message: 'Error fetching document', error: error.message }, { status: 500 });
  }
}