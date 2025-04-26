// pages/index.tsx
'use client'
import { useEffect, useRef, useState } from 'react';
import { Chat } from './components/chat';


const DOC_ID = '1YaA-1O9oRPPZJUbSEdsduQYsnw7e0wbpQoWESp_62IY';
const SHEET_ID = '1sC6mMTE83EtifBARKHWe-lZdQsLPcrFzhYHfJRoHCDY';


export default function Home() {
  const [doc, setDoc] = useState<any>(null);
  const [input, setInput] = useState('');
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [changed, setChanged] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('docs');

  // DOCS 

  const handleGetDoc = async () => {
    const res = await fetch(`/api/docs/${DOC_ID}`);
    const data = await res.json();
    setDoc(data);
    setLoading(false);
  };

  useEffect(() => {
    if (selected === 'docs') {
      handleGetDoc();
    }
  }, [selected]);

  const fetchRevision = async () => {
    const res = await fetch(`/api/docs?docId=${DOC_ID}`);
    const data = await res.json();
    return data.revisionId;
  };

  useEffect(() => {
    if (selected === 'docs') {
      const startPolling = async () => {
        const initial = await fetchRevision();
        setRevisionId(initial);

        intervalRef.current = setInterval(async () => {
          const current = await fetchRevision();
          if (revisionId && current !== revisionId) {
            setRevisionId(current); // actualizar el valor para seguir comparando
            handleGetDoc();
          }
        }, 20000); // cada 20 segundos
      };

      startPolling();

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [revisionId]);

  const handleSubmit = async () => {
    const res = await fetch(`/api/docs/${DOC_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: input,
        index: doc?.body?.content[doc?.body?.content?.length - 1]?.endIndex - 1
      }),
    });

    const data = await res.json();
    setInput('');
    handleGetDoc();
  };



  // SHEETS

  const [data, setData] = useState<string[][]>([]);
  const [inputValue, setInputValue] = useState('');
  const [cell, setCell] = useState('A1');
  const [value, setValue] = useState('');

  const getCellValue = async () => {
    const res = await fetch(`/api/sheets/${SHEET_ID}?range=Hoja 1!${cell}`);
    const data = await res.json();
    setValue(data?.values?.[0]?.[0] || 'Vacío');
  };


  const range = `'Hoja 1'!A1:H40`;

  const fetchSheetData = async () => {
    const res = await fetch(`/api/sheets/${SHEET_ID}?range=${range}`);
    const json = await res.json();
    setData(json.values || []);
  };

  console.log(data);

  const writeToSheet = async () => {
    let values = [];

    if (cell.includes(':')) {
      const [start, end] = cell.split(':');
      const startRow = parseInt(start.match(/\d+/)?.[0] || '0');
      const endRow = parseInt(end.match(/\d+/)?.[0] || '0');
      const numRows = endRow - startRow + 1;

      values = Array.from({ length: numRows }, () => [inputValue]);
    } else {
      values = [[inputValue]];
    }

    const res = await fetch(`/api/sheets/${SHEET_ID}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sheetId: SHEET_ID,
        range: `'Hoja 1'!${cell}`,
        values,
      }),
    });

    const json = await res.json();
    console.log('Respuesta write:', json);
    setInputValue('');
    fetchSheetData();
  };

  useEffect(() => {
    if (selected === 'sheets') {
      fetchSheetData();
    }
  }, [selected]);

  return (
    <>
      <nav className='flex justify-evenly items-center border-b py-4'>
        <ul className='flex justify-evenly gap-10'>
          <li className={`cursor-pointer hover:text-blue-500 ${selected === 'docs' ? 'text-blue-500' : ''}`} onClick={() => setSelected('docs')}>DOCS</li>
          <li className={`cursor-pointer hover:text-blue-500 ${selected === 'sheets' ? 'text-blue-500' : ''}`} onClick={() => setSelected('sheets')}>Sheets</li>
        </ul>
      </nav>
      <main className={`grid ${selected === 'sheets' ? 'grid-cols-[4fr]' : 'grid-cols-[4fr_1.5fr]'} h-screen mx-36 gap-10 py-10`}>

        <div className='h-full rounded-md overflow-hidden'>
          {
            loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
              </div>
            ) : (
              <>
                {selected === 'docs' && (
                  <iframe className='h-full w-full ' src="https://docs.google.com/document/d/1YaA-1O9oRPPZJUbSEdsduQYsnw7e0wbpQoWESp_62IY/edit?embedded=true"></iframe>
                )}
                {
                  selected === 'sheets' && (
                    <iframe className='h-screen w-full ' src="https://docs.google.com/spreadsheets/d/1sC6mMTE83EtifBARKHWe-lZdQsLPcrFzhYHfJRoHCDY/edit?embedded=true"></iframe>
                  )
                }
              </>
            )
          }
        </div>
        <div className='h-full flex justify-center items-center w-full'>
          {
            selected === 'docs' && (
             <Chat docId={DOC_ID} doc={doc}/>
            )}
          {/* {
            selected === 'sheets' && (
              <div className='flex flex-col gap-4 w-full max-w-md'>
                <h1>Actualizar Google Sheet</h1>
                <input value={cell} onChange={(e) => setCell(e.target.value)} placeholder="Ej: A2" />
                <button onClick={getCellValue}>Leer celda</button>
                <p>Valor: {value}</p>
                <input
                  type="text"
                  value={inputValue}
                  className='border rounded-md p-2'
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe algo..."
                />
                <button className='bg-blue-500 text-white p-2 rounded-md cursor-pointer' onClick={writeToSheet}>Actualizar</button>
              </div>
            )
          } */}
        </div>
      </main>
    </>
  );
}



{/* <div style={{
        paddingInline: doc ? `${doc.documentStyle.marginLeft.magnitude}pt` : 0,
        paddingBlock: doc ? `${doc.documentStyle.marginTop.magnitude}pt` : 0,
      }} className='bg-white w-full h-full text-black'>
        {doc &&
          doc.body.content.map((item: any, i: number) => {
            if (item.paragraph) {
              return (
                <p key={i}>
                  {item.paragraph.elements.map((element: any) => {
                    if (element.textRun) {
                      return element.textRun.content;
                    }
                  })}
                </p>
              );
            }
          })
        }
      </div> */}