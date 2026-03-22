"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

interface CsvRow {
  name: string;
  category: string;
  price: string;
  condition: string;
  brand: string;
  model: string;
  yearFrom: string;
  yearTo: string;
  description: string;
}

export function CsvImport() {
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setImported(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter((l) => l.trim());

        if (lines.length < 2) {
          setError("CSV musí obsahovat hlavičku a alespoň jeden řádek dat");
          return;
        }

        const header = lines[0].split(";").map((h) => h.trim().toLowerCase());
        const expectedHeaders = ["nazev", "kategorie", "cena", "stav", "znacka", "model", "rok_od", "rok_do", "popis"];

        // Validate headers loosely
        if (header.length < 3) {
          setError("CSV musí mít alespoň 3 sloupce (název, kategorie, cena)");
          return;
        }

        const parsed: CsvRow[] = [];
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(";").map((c) => c.trim());
          parsed.push({
            name: cols[0] ?? "",
            category: cols[1] ?? "",
            price: cols[2] ?? "",
            condition: cols[3] ?? "FUNCTIONAL",
            brand: cols[4] ?? "",
            model: cols[5] ?? "",
            yearFrom: cols[6] ?? "",
            yearTo: cols[7] ?? "",
            description: cols[8] ?? "",
          });
        }

        setRows(parsed.filter((r) => r.name));
      } catch {
        setError("Nepodařilo se zpracovat CSV soubor");
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setImporting(true);
    try {
      // Sestavit CSV string v formatu ocekavanem API (comma-separated, anglicke hlavicky)
      const header = "name,category,condition,price,description,compatiblebrands,compatiblemodels,compatibleyearfrom,compatibleyearto";
      const csvLines = rows.map((r) =>
        [
          `"${r.name}"`,
          `"${r.category}"`,
          `"${r.condition}"`,
          r.price,
          `"${r.description}"`,
          `"${r.brand}"`,
          `"${r.model}"`,
          r.yearFrom,
          r.yearTo,
        ].join(",")
      );
      const csvBody = [header, ...csvLines].join("\n");

      const res = await fetch("/api/parts/import", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: csvBody,
      });

      const data = await res.json();

      if (res.ok) {
        setImported(true);
        setRows([]);
        if (data.errors > 0) {
          setError(`Importováno ${data.imported} dílů, ${data.errors} chyb.`);
        }
      } else {
        setError(data.error ?? "Chyba při importu");
      }
    } catch {
      setError("Chyba při importu");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = "nazev;kategorie;cena;stav;znacka;model;rok_od;rok_do;popis\nPřední nárazník;BODYWORK;4500;FUNCTIONAL;skoda;octavia;2013;2020;Bez poškození\nAlternátor;ELECTRO;3200;FUNCTIONAL;vw;golf;2015;2020;Plně funkční";
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carmakler-dily-sablona.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Hromadný import dílů</h2>
        <p className="text-sm text-gray-500 mt-1">
          Nahrajte CSV soubor s díly. Oddělení středníkem.
        </p>
      </div>

      {/* Download template */}
      <button
        onClick={downloadTemplate}
        className="text-sm text-green-600 font-semibold cursor-pointer bg-transparent border-none underline"
      >
        Stáhnout šablonu CSV
      </button>

      {/* Upload area */}
      <div
        onClick={() => fileRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-green-400 hover:bg-green-50 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-gray-400 mx-auto mb-3">
          <path fillRule="evenodd" d="M11.47 2.47a.75.75 0 011.06 0l4.5 4.5a.75.75 0 01-1.06 1.06l-3.22-3.22V16.5a.75.75 0 01-1.5 0V4.81L8.03 8.03a.75.75 0 01-1.06-1.06l4.5-4.5zM3 15.75a.75.75 0 01.75.75v2.25a1.5 1.5 0 001.5 1.5h13.5a1.5 1.5 0 001.5-1.5V16.5a.75.75 0 011.5 0v2.25a3 3 0 01-3 3H5.25a3 3 0 01-3-3V16.5a.75.75 0 01.75-.75z" clipRule="evenodd" />
        </svg>
        <p className="text-gray-600 font-medium">Klikněte nebo přetáhněte CSV soubor</p>
        <p className="text-xs text-gray-400 mt-1">Formát: CSV, oddělení středníkem</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
      />

      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      {imported && (
        <Alert variant="success">
          Import proběhl úspěšně! Díly byly přidány do vašeho skladu.
        </Alert>
      )}

      {/* Preview */}
      {rows.length > 0 && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">
            Náhled ({rows.length} dílů)
          </h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {rows.map((row, i) => (
              <Card key={i} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-semibold text-sm text-gray-900">{row.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{row.category}</span>
                    {row.brand && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        {row.brand} {row.model} {row.yearFrom}-{row.yearTo}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold text-gray-900">{row.price} Kč</span>
                </div>
              </Card>
            ))}
          </div>

          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setRows([]);
                if (fileRef.current) fileRef.current.value = "";
              }}
            >
              Zrušit
            </Button>
            <Button
              variant="primary"
              className="flex-1 bg-gradient-to-br from-green-500 to-green-600"
              onClick={handleImport}
              disabled={importing}
            >
              {importing ? "Importuji..." : `Importovat ${rows.length} dílů`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
