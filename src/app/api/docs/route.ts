// pages/api/docs/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import { getGoogleDocsClient } from '@/lib/google';
import { NextResponse } from 'next/server';

interface Params {
    params: { id: string };
}


export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get('docId');

    if (!docId) {
        return NextResponse.json({ error: 'Faltan campos' }, { status: 400 });
    }

    try {
        const docs = await getGoogleDocsClient();
        const doc = await docs.documents.get({ documentId: docId as string });

        return NextResponse.json({ revisionId: doc.data.revisionId });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: 'Error fetching document', error: error.message }, { status: 500 });
    }
}

