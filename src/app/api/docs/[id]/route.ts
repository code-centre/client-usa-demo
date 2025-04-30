// pages/api/docs/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getGoogleDocsClient } from '@/lib/google';
import { NextResponse } from 'next/server';

interface Params {
  params: { id: string };
}

export async function GET(request: Request, { params }: Params) {
  const id = await params.id;
    
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
  const { text, index = 1, actionType, data } = body;
  console.log(text);
  console.log(data);
  
  

  // if (!id || !text) return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });

  try {
      const docs = await getGoogleDocsClient();
      let requests: any[] = [];
      data.type.map((type: string) => {
        switch (type) {
          case 'insertText':
            requests.push({
              insertText: {
                location: { index: data.startIndex },
              text: text,
            },
          });
          break;
  
        case 'deleteContentRange':
          requests.push({
            deleteContentRange: {
              range: {
                startIndex: data.startIndex,
                endIndex: data.endIndex,
              },
            }, 
          }
        );
          break;
  
        case 'replaceAllText':
          requests.push({
            replaceAllText: {
              containsText: {
                text: data.searchText,
                matchCase: true,
              },
              replaceText: data.replaceText,
            },
          });
          break;
  
        case 'insertParagraph':
          requests.push({
            insertParagraph: {
              location: { index: data.startIndex },
              paragraphStyle: {
                namedStyleType: data.namedStyleType || 'NORMAL_TEXT',
              },
            },
          });
          break;
  
        case 'updateTextStyle':
          requests.push({
            updateTextStyle: {
              range: {
                startIndex: data.startIndex,
                endIndex: data.endIndex,
              },
              textStyle: data.textStyle, // Ej: { bold: true }
              fields: data.fields,       // Ej: 'bold,foregroundColor'
            },
          });
          break;
  
        case 'insertTable':
          requests.push({
            insertTable: {
              rows: data.rows,
              columns: data.columns,
              location: { index: data.index },
            },
          });
          break;
  
        case 'insertInlineImage':
          requests.push({
            insertInlineImage: {
              uri: data.imageUrl,
              location: { index: data.index },
              objectSize: {
                height: { magnitude: data.height || 50, unit: 'PT' },
                width: { magnitude: data.width || 50, unit: 'PT' },
              },
            },
          });
          break;
  
        case 'updateParagraphStyle':
          requests.push({
            updateParagraphStyle: {
              range: {
                startIndex: data.startIndex,
                endIndex: data.endIndex,
              },
              paragraphStyle: data.paragraphStyle, // Ej: { alignment: 'CENTER' }
              fields: data.fields,                 // Ej: 'alignment'
            },
          });
          break;
  
        case 'deleteParagraphBullets':
          requests.push({
            deleteParagraphBullets: {
              range: {
                startIndex: data.startIndex,
                endIndex: data.endIndex,
              },
            },
          });
          break;
  
        case 'insertPageBreak':
          requests.push({
            insertPageBreak: {
              location: { index: data.index },
            },
          });
          break;
  
        case 'insertSectionBreak':
          requests.push({
            insertSectionBreak: {
              sectionType: data.sectionType || 'CONTINUOUS',
              location: { index: data.index },
            },
          });
          break;
  
        case 'createNamedRange':
          requests.push({
            createNamedRange: {
              name: data.name,
              range: {
                startIndex: data.startIndex,
                endIndex: data.endIndex,
              },
            },
          });
          break;
  
        case 'deleteNamedRange':
          requests.push({
            deleteNamedRange: {
              name: data.name,
            },
          });
          break;
  
        default:
          return NextResponse.json({ message: 'Acción no soportada.' }, { status: 400 });
      }
    });
  
      const response = await docs.documents.batchUpdate({
        documentId: id as string,
        requestBody: {
          requests,
        },
      });

      // const response = await docs.documents.batchUpdate({
      //     documentId: id,
      //     requestBody: {
      //         requests: [
      //             {
      //                 insertText: {
      //                     location: {
      //                         index: index, // Insertar después del inicio
      //                     },
      //                     text: `${text}`,
      //                 },
      //             },
      //         ],
      //     },
      // });


      return NextResponse.json({ message: 'Documento actualizado', data: response.data });
  } catch (error: any) {
      console.error(error);
      return NextResponse.json({ message: 'Error fetching document', error: error.message }, { status: 500 });
  }
}