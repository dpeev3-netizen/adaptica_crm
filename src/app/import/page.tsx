"use client";

import CsvUploader from "@/components/CsvUploader";

export default function ImportPage() {
  return (
    <main className="min-h-screen p-8 lg:p-24 bg-background flex flex-col items-center justify-center">
      <div className="w-full max-w-4xl text-center mb-12">
        <h1 className="text-4xl font-extrabold text-foreground mb-4 drop-shadow-sm">
          Adaptica AI CRM V1
        </h1>
        <p className="text-xl text-foreground opacity-70">
          Data Ingestion Engine
        </p>
      </div>

      <CsvUploader />
    </main>
  );
}
