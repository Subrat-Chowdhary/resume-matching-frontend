// File: /opt/resume-matching-system/frontend/app/upload/page.tsx
"use client";
import React, { useRef, useState } from "react";
import { API_ENDPOINTS, JOB_CATEGORIES, type JobCategory, type UploadResponse } from "@/lib/api";

type UploadResult = {
  filename: string;
  status: string;
};

export default function UploadResumePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobCategory, setJobCategory] = useState<JobCategory>("Backend");
  const [description, setDescription] = useState<string>("");
  const [results, setResults] = useState<UploadResult[]>([]);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
    setResults([]);
    setError(null);
    setSuccessMsg(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Select at least one file.");
      setSuccessMsg(null);
      return;
    }
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    setResults([]);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    formData.append("job_category", jobCategory);
    if (description.trim()) {
      formData.append("description", description.trim());
    }

    try {
      const res = await fetch(API_ENDPOINTS.UPLOAD_PROFILE, {
        method: "POST",
        body: formData,
      });
      const data: UploadResponse = await res.json();

      if (data.status === "success" && typeof data.files_uploaded === "number") {
        setSuccessMsg(`${data.files_uploaded} file(s) uploaded successfully!`);
        setFiles([]); // clear state
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = ""; // clear input UI
      } else if (Array.isArray(data.result)) {
        setResults(data.result);
        setSuccessMsg("Files uploaded!");
        setFiles([]);
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        setError("Unexpected response: " + JSON.stringify(data));
      }
    } catch (err) {
      setError("Upload failed: " + (err instanceof Error ? err.message : String(err)));
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen  flex flex-col items-center justify-start py-16">
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-xl w-full border border-gray-200">
        <h1 className="text-2xl font-bold mb-6 text-center text-slate-800"><span className="text-orange-500 font-extrabold">Upload </span>Resumes</h1>
        
        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Resume Files
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.zip"
            multiple
            onChange={handleFileChange}
            className="w-full rounded px-3 py-2 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-black file:hover:bg-orange-500 file:text-white text-gray-600"
          />
        </div>

        {/* Job Category */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Category *
          </label>
          <select
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-200"
          >
            {JOB_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this batch of resumes..."
            rows={3}
            className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-50 text-gray-800 placeholder-gray-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          className="w-full bg-black hover:bg-orange-600 text-white py-2 rounded-lg font-semibold transition disabled:bg-gray-300"
        >
          {loading ? "Uploading..." : "Upload"}
        </button>
        {error && <p className="text-red-500 mt-4">{error}</p>}
        {successMsg && <p className="text-green-600 mt-4">{successMsg}</p>}
        {/* Show file chips ONLY if files selected & not uploaded */}
        {files.length > 0 && !successMsg && (
          <div className="flex flex-wrap gap-2 mt-3">
            {files.map((f, i) => {
              let name = f.name.replace(/\.[^/.]+$/, "");
              name = name.replace(/resume/gi, "");
              name = name.replace(/[_\-]+/g, " ");
              name = name
                .trim()
                .split(/\s+/)
                .filter(Boolean)
                .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                .join("");
              return (
                <span
                  key={i}
                  className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-xs font-medium shadow-sm border border-gray-300"
                >
                  {name}
                </span>
              );
            })}
          </div>
        )}
        {results.length > 0 && (
          <div className="mt-6">
            <h2 className="font-semibold text-lg mb-2 text-slate-700">Upload Results:</h2>
            <ul className="space-y-2">
              {results.map((r, i) => (
                <li key={i} className="border rounded px-3 py-2 bg-green-50 border-green-200 flex justify-between items-center">
                  <span className="text-slate-700 text-sm">{r.filename}</span>
                  <span className="text-xs text-green-700">{r.status}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
