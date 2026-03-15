"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";

type CsvContactRow = {
  "First Name": string;
  "Last Name": string;
  "Email": string;
  "Phone": string;
  "Company Name": string;
};

export default function CsvUploader() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsUploading(true);
    setMessage("Parsing CSV...");

    Papa.parse<CsvContactRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        setMessage(`Uploading ${results.data.length} rows...`);
        
        try {
          const res = await fetch("/api/bulk-import", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(results.data),
          });

          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.error || "Upload failed");
          }

          const data = await res.json();
          setMessage(`Success! Imported ${data.count} contacts.`);
        } catch (error: any) {
          setMessage(`Error: ${error.message}`);
        } finally {
          setIsUploading(false);
        }
      },
      error: (error) => {
        setMessage(`Parsing error: ${error.message}`);
        setIsUploading(false);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
    },
    multiple: false,
  });

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-background rounded-3xl shadow-neumorph-flat max-w-2xl w-full mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-foreground">Import Contacts</h2>
      
      <div
        {...getRootProps()}
        className={`w-full p-12 flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all duration-300 ease-in-out ${
          isDragActive 
            ? "shadow-neumorph-pressed translate-y-1" 
            : "shadow-neumorph-flat hover:shadow-neumorph-pressed hover:translate-y-1"
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-lg font-medium text-foreground opacity-80 text-center">
          {isDragActive
            ? "Drop the CSV file here..."
            : "Drag 'n' drop a CSV file here, or click to select one"}
        </div>
        <div className="text-sm mt-2 opacity-60">
          Expected format: First Name, Last Name, Email, Phone, Company Name
        </div>
      </div>

      {message && (
        <div className="mt-6 p-4 rounded-xl shadow-neumorph-pressed w-full text-center font-medium">
          {isUploading ? (
            <span className="animate-pulse">{message}</span>
          ) : (
            <span className={message.startsWith("Error:") ? "text-red-500" : "text-green-600"}>
              {message}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
