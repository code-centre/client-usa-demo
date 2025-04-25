// pages/index.tsx
'use client'
import { useEffect, useRef, useState } from 'react';


const DOC_ID = '1YaA-1O9oRPPZJUbSEdsduQYsnw7e0wbpQoWESp_62IY';


export default function Home() {
  const [doc, setDoc] = useState<any>(null);
  const [input, setInput] = useState('');
  const [revisionId, setRevisionId] = useState<string | null>(null);
  const [changed, setChanged] = useState(true);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState('docs');


  const handleGetDoc = async () => {
    const res = await fetch(`/api/docs/${DOC_ID}`);
    const data = await res.json();
    setDoc(data);
    setLoading(false);
  };

  useEffect(() => {
    handleGetDoc();
  }, []);

  const fetchRevision = async () => {
    const res = await fetch(`/api/docs?docId=${DOC_ID}`);
    const data = await res.json();
    return data.revisionId;
  };

  useEffect(() => {
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

  console.log(doc?.body?.content[doc?.body?.content?.length - 1]?.endIndex);

  return (
    <>
      <nav className='flex justify-evenly items-center border-b py-4'>
        <ul className='flex justify-evenly gap-10'>
          <li className={`cursor-pointer hover:text-blue-500 ${selected === 'docs' ? 'text-blue-500' : ''}`} onClick={() => setSelected('docs')}>DOCS</li>
          <li className={`cursor-pointer hover:text-blue-500 ${selected === 'sheets' ? 'text-blue-500' : ''}`} onClick={() => setSelected('sheets')}>Sheets</li>
        </ul>
      </nav>
      <main className='grid grid-cols-[4fr_1.5fr] h-screen mx-36 gap-10 py-10'>

        <div className='h-full rounded-md overflow-hidden'>
          {
            loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-500"></div>
              </div>
            ) : (
              selected === 'docs' && (
                <iframe className='h-full w-full ' src="https://docs.google.com/document/d/1YaA-1O9oRPPZJUbSEdsduQYsnw7e0wbpQoWESp_62IY/edit?embedded=true"></iframe>
              )
            )
          }
        </div>
        <div className='h-full flex justify-center items-center w-full'>
          {
            selected === 'docs' && (
              <div className='flex flex-col gap-4 w-full max-w-md'>
                <h1>Actualizar Google Doc</h1>
                <input
                  type="text"
                  value={input}
                  className='border rounded-md p-2'
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe algo..."
                />
                <button className='bg-blue-500 text-white p-2 rounded-md cursor-pointer' onClick={handleSubmit}>Actualizar</button>
              </div>
            )}
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