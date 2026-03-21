"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { UploadCloud, CheckCircle2, AlertCircle, ArrowRight, Table, X } from "lucide-react";
import NeoButton from "./ui/NeoButton";
import { fetchWithToken } from "@/lib/api";

// The fields our CRM expects
const CRM_FIELDS = [
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email Address" },
  { key: "phone", label: "Phone Number" },
  { key: "companyName", label: "Company Name" },
  { key: "website", label: "Website URL" },
];

export default function CsvUploader() {
  const [step, setStep] = useState<"UPLOAD" | "MAP" | "PREVIEW" | "RESULTS">("UPLOAD");
  
  // State for parsed CSV data
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<any[]>([]);
  
  // Mapping: CRM key -> CSV Header string
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({});
  
  // Results processing
  const [isUploading, setIsUploading] = useState(false);
  const [importResults, setImportResults] = useState<{
    success: number;
    total: number;
    errors?: Array<{ row: number; error: string }>;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields || results.data.length === 0) {
          alert("Invalid or empty CSV file.");
          return;
        }

        const headers = results.meta.fields.filter(Boolean);
        setCsvHeaders(headers);
        setCsvData(results.data);

        // Try to auto-map common names
        const initialMap: Record<string, string> = {};
        CRM_FIELDS.forEach(field => {
          const lowerKey = field.key.toLowerCase();
          const lowerLabel = field.label.toLowerCase();
          const match = headers.find(h => {
             const lowerH = h.toLowerCase();
             return lowerH === lowerKey || lowerH === lowerLabel || lowerH.includes(lowerKey.replace("name", "").trim()) || lowerH.includes("company");
          });
          
          if (match) initialMap[field.key] = match;
        });

        setFieldMap(initialMap);
        setStep("MAP");
      },
      error: (error) => {
        alert(`Parsing error: ${error.message}`);
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    multiple: false,
  });

  const handleImport = async () => {
    setIsUploading(true);
    
    // Transform raw CSV data into expected payload based on the mapping
    const payload = csvData.map(row => {
       const mappedRow: Record<string, any> = {};
       CRM_FIELDS.forEach(field => {
          const csvColumn = fieldMap[field.key];
          if (csvColumn && row[csvColumn]) {
             mappedRow[field.key] = row[csvColumn];
          }
       });
       return mappedRow;
    });

    try {
      const res = await fetchWithToken("/bulk-import", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      
      setImportResults({
        success: data.count || 0,
        total: payload.length,
        errors: data.errors
      });
      setStep("RESULTS");
    } catch (error: any) {
      alert(`Fatal Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const reset = () => {
    setStep("UPLOAD");
    setCsvHeaders([]);
    setCsvData([]);
    setFieldMap({});
    setImportResults(null);
  };

  return (
    <div className="flex flex-col w-full max-w-[90vw] xl:max-w-[1400px] mx-auto bg-surface border border-outline-variant rounded-[32px] md-elevation-3 overflow-hidden">
      {/* Steps Header */}
      <div className="flex items-center justify-between p-6 border-b border-outline-variant bg-surface-container-low">
        <h2 className="md-title-large text-on-surface flex items-center gap-2">
          <Table className="text-primary w-6 h-6" /> Import CRM Data
        </h2>
        <div className="flex items-center gap-4 text-sm font-medium text-on-surface-variant opacity-80">
          <span className={step === "UPLOAD" ? "text-primary font-bold opacity-100" : ""}>1. Upload</span>
          <ArrowRight size={14} className="opacity-50" />
          <span className={step === "MAP" ? "text-primary font-bold opacity-100" : ""}>2. Map Columns</span>
          <ArrowRight size={14} className="opacity-50" />
          <span className={step === "PREVIEW" ? "text-primary font-bold opacity-100" : ""}>3. Preview</span>
          <ArrowRight size={14} className="opacity-50" />
          <span className={step === "RESULTS" ? "text-primary font-bold opacity-100" : ""}>4. Status</span>
        </div>
      </div>

      <div className="p-8">
        {step === "UPLOAD" && (
          <div
            {...getRootProps()}
            className={`w-full py-16 px-10 flex flex-col items-center justify-center rounded-[32px] cursor-pointer border-2 border-dashed transition-all duration-300 ease-in-out ${
              isDragActive 
                ? "border-primary bg-primary-container/30 scale-[1.02]" 
                : "border-outline-variant hover:border-primary/50 hover:bg-surface-container"
            }`}
          >
            <input {...getInputProps()} />
            <UploadCloud size={48} className={`mb-4 ${isDragActive ? "text-primary" : "text-on-surface-variant"}`} />
            <div className="md-title-large text-on-surface text-center">
              {isDragActive ? "Drop it like it's hot!" : "Drag & drop your CSV file"}
            </div>
            <div className="md-body-medium mt-2 text-on-surface-variant max-w-md text-center">
              Supports CSV files with any column names. We'll map them in the next step.
            </div>
          </div>
        )}

        {step === "MAP" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <p className="md-body-large text-on-surface-variant">Match your CSV columns to the CRM fields. We've auto-matched some where possible.</p>
            
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {CRM_FIELDS.map(field => (
                <div key={field.key} className="bg-surface-container border border-outline-variant rounded-2xl p-4 flex flex-col gap-2">
                  <label className="md-title-small text-on-surface flex justify-between items-center">
                    {field.label}
                    {fieldMap[field.key] ? <CheckCircle2 size={16} className="text-success" /> : <AlertCircle size={16} className="text-warning" />}
                  </label>
                  <select
                    value={fieldMap[field.key] || ""}
                    onChange={(e) => setFieldMap({ ...fieldMap, [field.key]: e.target.value })}
                    className="w-full px-4 py-2 bg-surface border border-outline-variant rounded-xl text-sm text-on-surface focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                  >
                    <option value="">-- Do not import --</option>
                    {csvHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <NeoButton variant="secondary" onClick={() => setStep("UPLOAD")}>Back</NeoButton>
              <NeoButton onClick={() => setStep("PREVIEW")}>Continue to Preview</NeoButton>
            </div>
          </div>
        )}

        {step === "PREVIEW" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <h3 className="md-title-large text-on-surface">Data Preview</h3>
              <p className="md-body-medium text-on-surface-variant">Showing the first 5 rows based on your mapping.</p>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-outline-variant bg-surface">
              <table className="w-full text-left">
                <thead className="bg-surface-container-low border-b border-outline-variant">
                  <tr>
                    {CRM_FIELDS.map(f => fieldMap[f.key] && (
                      <th key={f.key} className="px-5 py-3 md-title-small text-on-surface-variant font-medium">{f.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, i) => (
                    <tr key={i} className="border-b border-outline-variant last:border-0 hover:bg-surface-container-low transition-colors">
                      {CRM_FIELDS.map(f => fieldMap[f.key] && (
                        <td key={f.key} className="px-5 py-3 md-body-medium text-on-surface">{row[fieldMap[f.key]] || <span className="text-on-surface-variant/50 italic">Empty</span>}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <NeoButton variant="secondary" onClick={() => setStep("MAP")}>Back to Mapping</NeoButton>
              <NeoButton onClick={handleImport} disabled={isUploading}>
                {isUploading ? "Importing Data..." : `Import ${csvData.length} Rows`}
              </NeoButton>
            </div>
          </div>
        )}

        {step === "RESULTS" && importResults && (
          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-2 w-full max-w-3xl mx-auto">
              {/* SUCCESS CARD */}
              <div className="bg-surface-container border border-outline-variant rounded-[32px] py-10 px-12 flex flex-col items-center justify-center flex-1 w-full shadow-sm hover:bg-surface-container-high transition-colors">
                 <div className="bg-primary-container/40 p-4 rounded-full mb-4">
                   <CheckCircle2 size={40} className="text-primary" />
                 </div>
                 <span className="text-5xl font-bold text-on-surface">{importResults.success}</span>
                 <span className="md-label-large text-on-surface-variant uppercase tracking-wider mt-2">Successful Imports</span>
              </div>
              
              {/* ERROR CARD */}
              <div className="bg-surface-container border border-outline-variant rounded-[32px] py-10 px-12 flex flex-col items-center justify-center flex-1 w-full shadow-sm hover:bg-surface-container-high transition-colors">
                 <div className="bg-surface-container-highest p-4 rounded-full mb-4">
                   <X size={40} className="text-on-surface-variant" />
                 </div>
                 <span className="text-5xl font-bold text-on-surface">{importResults.errors?.length || 0}</span>
                 <span className="md-label-large text-on-surface-variant uppercase tracking-wider mt-2">Failed Rows</span>
              </div>
            </div>

            {importResults.errors && importResults.errors.length > 0 && (
              <div className="w-full bg-surface-container border border-outline-variant rounded-2xl p-5 max-h-[260px] overflow-y-auto shadow-inner">
                <h4 className="md-title-medium text-on-surface mb-2 sticky top-0 bg-surface-container pb-2 z-10 border-b border-outline-variant">Error Log</h4>
                <ul className="space-y-1.5 mt-2">
                  {importResults.errors.map((err, i) => (
                    <li key={i} className="flex gap-3 text-sm">
                       <span className="text-on-surface-variant font-mono w-[72px] align-top shrink-0">Row {err.row}:</span>
                       <span className="text-on-surface-variant flex-1 break-words leading-relaxed">{err.error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-center mt-8">
              <NeoButton onClick={reset} size="lg">Import Another File</NeoButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
