'use client';

import { useState } from 'react';

type SheetsResponse = {
  sheets: Record<string, Record<string, unknown>[]>;
};

export default function ExcelToJsonUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<SheetsResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch('/api/excel-to-json', {
      method: 'POST',
      body: formData,
    });

    const json = (await res.json()) as SheetsResponse;
    setResult(json);
    setLoading(false);
  };

  return (
    <div style={{ padding: 16 }}>
      <h1>Excel → JSON 変換</h1>

      <input type="file" accept=".xlsx,.xls" onChange={handleFileChange} />

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || loading}
        style={{ marginLeft: 8 }}
      >
        {loading ? '変換中...' : 'アップロードして変換'}
      </button>

      {result && (
        <div style={{ marginTop: 24 }}>
          <h2>結果（タブごと）</h2>
          {Object.entries(result.sheets).map(([sheetName, rows]) => (
            <div key={sheetName} style={{ marginBottom: 16 }}>
              <h3>{sheetName}</h3>
              <pre style={{ background: '#111', color: '#eee', padding: 8 }}>
                {JSON.stringify(rows, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
