// File: /opt/resume-matching-system/frontend/app/upload/page.tsx
"use client";
import React, { useRef, useState } from "react";
import { 
  API_ENDPOINTS, 
  type UploadResponse, 
  type UploadedFile, 
  type RejectedFile,
  formatFileSize,
  formatUploadTimestamp,
  extractCleanName
} from "@/lib/api";

export default function UploadResumePage() {
  const [files, setFiles] = useState<File[]>([]);
  const [jobRole, setJobRole] = useState<string>("");
  const [uploadResponse, setUploadResponse] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
    setUploadResponse(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Select at least one file.");
      return;
    }
    setLoading(true);
    setError(null);
    setUploadResponse(null);

    const formData = new FormData();
    files.forEach((f) => formData.append("files", f));
    if (jobRole.trim()) {
      formData.append("job_role", jobRole.trim());
    }

    try {
      const res = await fetch(API_ENDPOINTS.UPLOAD_PROFILE, {
        method: "POST",
        body: formData,
      });
      const data: UploadResponse = await res.json();

      if (res.ok && data.success) {
        setUploadResponse(data);
        
        // Clear form
        setFiles([]);
        setJobRole("");
        if (fileInputRef.current) fileInputRef.current.value = "";
        
      } else {
        setError(data.message || `Upload failed: ${res.statusText || 'Unknown error'}`);
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

        {/* Job Role */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-black mb-2">
            Job Role (Optional)
          </label>
          <input
            type="text"
            value={jobRole}
            onChange={(e) => setJobRole(e.target.value)}
            placeholder="e.g., Backend Developer, Frontend Engineer, Data Scientist..."
            className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white text-black font-medium placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
          />
          <p className="text-xs text-gray-500 mt-1">
            Specify the job role to categorize these resumes (optional)
          </p>
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
        
        {uploadResponse && (
          <div className="mt-4 space-y-4">
            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
              <div className="font-medium">{uploadResponse.message}</div>
              <div className="text-sm mt-1">{uploadResponse.status_message}</div>
            </div>

            {/* Summary Stats */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <h3 className="font-semibold text-blue-800 mb-2">📊 Upload Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Files Submitted:</span>
                  <span className="font-medium ml-2">{uploadResponse.summary.total_files_submitted}</span>
                </div>
                <div>
                  <span className="text-blue-600">Files Processed:</span>
                  <span className="font-medium ml-2">{uploadResponse.summary.total_files_processed}</span>
                </div>
                <div>
                  <span className="text-green-600">Successful:</span>
                  <span className="font-medium ml-2">{uploadResponse.summary.successful_uploads}</span>
                </div>
                <div>
                  <span className="text-red-600">Rejected:</span>
                  <span className="font-medium ml-2">{uploadResponse.summary.rejected_files}</span>
                </div>
              </div>
            </div>

            {/* Bucket Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <h3 className="font-semibold text-gray-800 mb-2">🗂️ Storage Information</h3>
              <div className="text-sm space-y-1">
                <div>
                  <span className="text-gray-600">Bucket:</span>
                  <span className="font-medium ml-2">{uploadResponse.bucket_info.bucket_name}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium ml-2">{uploadResponse.bucket_info.status}</span>
                </div>
                <div className="text-gray-600">{uploadResponse.bucket_info.message}</div>
              </div>
            </div>

            {/* Successfully Uploaded Files */}
            {uploadResponse.uploaded_files.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">✅ Successfully Uploaded Files</h3>
                <div className="space-y-3">
                  {uploadResponse.uploaded_files.map((file, i) => (
                    <div key={i} className="border rounded-lg px-4 py-3 bg-green-50 border-green-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">
                            {extractCleanName(file.original_filename)}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Original: {file.original_filename}
                          </div>
                          <div className="text-xs text-gray-600">
                            Stored as: {file.unique_filename}
                          </div>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>📁 {file.bucket_name}</span>
                            <span>📏 {formatFileSize(file.file_size_mb)}</span>
                            <span>🕒 {formatUploadTimestamp(file.upload_timestamp)}</span>
                          </div>
                        </div>
                        <span className="text-xs text-green-700 bg-green-100 px-2 py-1 rounded-full whitespace-nowrap">
                          ✅ {file.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rejected Files */}
            {uploadResponse.rejected_files.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <h3 className="font-semibold text-gray-800 mb-3">❌ Rejected Files</h3>
                <div className="space-y-3">
                  {uploadResponse.rejected_files.map((file, i) => (
                    <div key={i} className="border rounded-lg px-4 py-3 bg-red-50 border-red-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{file.original_filename}</div>
                          <div className="text-sm text-red-600 mt-1">{file.reason}</div>
                          {file.error_details && (
                            <div className="text-xs text-gray-600 mt-1">{file.error_details}</div>
                          )}
                        </div>
                        <span className="text-xs text-red-700 bg-red-100 px-2 py-1 rounded-full whitespace-nowrap">
                          ❌ Rejected
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Show file chips ONLY if files selected & not uploaded */}
        {files.length > 0 && !uploadResponse && (
          <div className="flex flex-wrap gap-2 mt-3">
            {files.map((f, i) => {
              const name = extractCleanName(f.name);
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
        </div>
      </div>
    </div>
  );
}
