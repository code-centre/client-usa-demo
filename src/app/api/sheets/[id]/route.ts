import { getSheetsClient } from "@/lib/sheets";
import { NextResponse } from "next/server";

interface Params {
    params: {
        id: string;
    };
}


export async function GET(request: Request, { params }: Params) {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range');
    const sheetId = id;

    if (!sheetId || !range) {
        return NextResponse.json({ error: 'Faltan parámetros: sheetId y range' }, { status: 400 });
    }

    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId as string,
            range: range as string, // Ejemplo: "Hoja1!A1:C10"
        });

        return NextResponse.json({ values: response.data.values });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request, { params }: Params) {
    const body = await request.json()
    const { sheetId, range, values } = body;

    if (!sheetId || !range || !values) {
        return NextResponse.json({ error: 'Faltan parámetros' }, { status: 400 });
    }

    try {
        const sheets = await getSheetsClient();
        const response = await sheets.spreadsheets.values.update({
            spreadsheetId: sheetId,
            range,
            valueInputOption: 'RAW',
            requestBody: {
                values,
            },
        });

        return NextResponse.json({ updatedRange: response.data.updatedRange });
    } catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

