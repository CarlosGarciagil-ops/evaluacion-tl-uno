import React, { FormEvent, useState } from 'react';
import { createRoot } from 'react-dom/client';

function App() {
  const [message, setMessage] = useState('');

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('Enviando...');

    const form = event.currentTarget;
    const input = form.elements.namedItem('file') as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      setMessage('Seleccione un archivo');
      return;
    }

    const body = new FormData();
    body.append('file', file);

    const response = await fetch('/api/documentos/cargar', {
      method: 'POST',
      body,
    });

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) {
      const raw = await response.text();
      setMessage(`Respuesta inesperada (${response.status}): ${raw.slice(0, 80)}`);
      return;
    }

    const data = await response.json();
    setMessage(JSON.stringify(data));
  }

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'Arial' }}>
      <h1>Carga documental</h1>
      <form onSubmit={upload}>
        <input name="file" type="file" />
        <button type="submit">Cargar</button>
      </form>
      <pre>{message}</pre>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
