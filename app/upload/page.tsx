// File: /opt/resume-matching-system/frontend/app/upload/page.tsx
"use client";
import React, { useRef, useState } from "react";
import { API_ENDPOINTS, JOB_CATEGORIES, type JobCategory, type UploadResponse } from "@/lib/api";

type UploadResult = {
  original_filename: string;
  unique_filename: string;
  file_size: number;
  upload_timestamp: string;
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

      if (data.message === "Upload completed") {
        // Create success message
        let successMessage = `🎉 Upload Successful!\n`;
        successMessage += `✅ ${data.successful_uploads} file(s) uploaded successfully`;
        
        if (data.failed_uploads > 0) {
          successMessage += `\n❌ ${data.failed_uploads} file(s) failed`;
        }
        
        successMessage += `\n📁 Category: ${data.job_category}`;
        
        setSuccessMsg(successMessage);
        
        // Set results for detailed view
        setResults(data.uploaded_files.map(file => ({
          original_filename: file.original_filename,
          unique_filename: file.unique_filename,
          file_size: file.file_size,
          upload_timestamp: file.upload_timestamp
        })));
        
        // Clear form
        setFiles([]);
        setDescription("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        
      } else {
        setError(`Upload failed: ${data.message || 'Unknown error'}`);
      }
    } catch (err) {
      setError("Upload failed: " + (err instanceof Error ? err.message : String(err)));
    }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-3xl font-bold mb-2 text-black">
            <span className="text-orange-600">Upload</span> Resumes
          </h1>
          <p className="text-gray-600 mb-8 font-medium">
            Add new resumes to your database for AI-powered matching
          </p>
        
        {/* File Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-black mb-2">
            Select Resume Files
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.zip"
            multiple
            onChange={handleFileChange}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:hover:bg-orange-700 file:text-white text-black font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        {/* Job Category */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-black mb-2">
            Job Category *
          </label>
          <select
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value as JobCategory)}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-black font-medium focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
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
          <label className="block text-sm font-semibold text-black mb-2">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description for this batch of resumes..."
            rows={3}
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-black font-medium placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
        </div>

        <button
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          className="btn-primary w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Uploading...</span>
            </div>
          ) : (
            'Upload Resumes'
          )}
        </button>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium">
            {error}
          </div>
        )}
        
        {successMsg && (
          <div className="mt-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl font-medium">
            <pre className="whitespace-pre-line font-medium">{successMsg}</pre>
          </div>
        )}
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
            <h2 className="font-semibold text-lg mb-3 text-slate-700">📋 Uploaded Files Details:</h2>
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="border rounded-lg px-4 py-3 bg-green-50 border-green-200">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-slate-800 font-medium text-sm">{r.original_filename}</span>
                    <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full">✅ Success</span>
                  </div>
                  <div className="text-xs text-slate-600 space-y-1">
                    <div>📁 Stored as: {r.unique_filename}</div>
                    <div>📊 Size: {(r.file_size / 1024).toFixed(1)} KB</div>
                    <div>🕒 Uploaded: {new Date(r.upload_timestamp).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
