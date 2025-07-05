// File: /opt/resume-matching-system/frontend/app/search/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { API_ENDPOINTS, JOB_CATEGORIES, type JobCategory, type SearchResult, type SearchResponse, extractFirstLastName, extractCandidateName } from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [jobCategory, setJobCategory] = useState<JobCategory | "">("");
  const [threshold, setThreshold] = useState(0.7);
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [selectedResume, setSelectedResume] = useState<SearchResult | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [resumeContent, setResumeContent] = useState<string>("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // remove duplicates by filename
  const uniqueResults = useMemo(() => {
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.filename)) return false;
      seen.add(r.filename);
      return true;
    });
  }, [results]);

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const formData = new FormData();
      formData.append("query", query.trim());
      if (jobCategory) {
        formData.append("job_category", jobCategory);
      }
      formData.append("limit", limit.toString());
      formData.append("similarity_threshold", threshold.toString());

      const res = await fetch(API_ENDPOINTS.SEARCH_PROFILE, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data: SearchResponse = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      alert("Search failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Modal functions
  const openResumeModal = async (resume: SearchResult) => {
    setSelectedResume(resume);
    setModalLoading(true);
    setResumeContent("");
    
    try {
      // For now, we'll show the text_preview. In future, you can add API to get full content
      // or implement PDF viewer for the MinIO file
      setResumeContent(resume.text_preview || "No preview available");
    } catch (error) {
      console.error("Error loading resume:", error);
      setResumeContent("Error loading resume content");
    } finally {
      setModalLoading(false);
    }
  };

  // Download function
  const downloadResume = async (resume: SearchResult) => {
    console.log("Download button clicked!", resume.filename);
    console.log("MinIO path:", resume.minio_path);
    
    setDownloadLoading(true);
    
    try {
      // Use backend API to download the file
      const response = await fetch(API_ENDPOINTS.DOWNLOAD_RESUME, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          minio_path: resume.minio_path,
          filename: resume.filename
        }),
      });
      
      console.log("Download response:", response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Download failed: ${response.status} - ${errorText}`);
      }
      
      // Get the file as a blob
      const blob = await response.blob();
      console.log("Blob created, size:", blob.size);
      
      if (blob.size === 0) {
        throw new Error("Downloaded file is empty");
      }
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      console.log("Blob URL created:", url);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = resume.filename;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      console.log("Clicking download link...");
      link.click();
      document.body.removeChild(link);
      
      // Clean up the temporary URL
      URL.revokeObjectURL(url);
      console.log("Download completed successfully!");
      
    } catch (error) {
      console.error("Error downloading resume:", error);
      alert(`Failed to download resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedResume(null);
    setResumeContent("");
    setDownloadLoading(false);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedResume) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedResume]);

  return (
    <div className="min-h-screen  flex flex-col items-center py-10">
      {/* Search Card */}
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          <span className="text-orange-500">AI </span>Resume Matcher
        </h1>

        {/* Job Description */}
        <textarea
          className="w-full p-4 border border-gray-300 rounded-md mb-4 bg-gray-100 text-gray-800 placeholder-gray-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder="Paste or type the job description here..."
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Job Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-200"
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value as JobCategory | "")}
            >
              <option value="">All Categories</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Max Results */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Results
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-800 focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. 5"
            />
          </div>

          {/* Similarity Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sensitivity: {threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!query || loading}
          className="w-full bg-black hover:bg-orange-600 hover:text-white active:bg-orange-700 text-white py-3 rounded-md font-semibold transition disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Results Grid */}
      <div className="w-full max-w-5xl mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {uniqueResults.map((r) => {
          const { firstName, lastName } = extractFirstLastName(r.filename);
          const candidateName = extractCandidateName(r.filename);
          
          return (
            <div
              key={r.id}
              className="bg-green-100 hover:bg-orange-200 p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 border-orange-500"
            >
              {/* Candidate Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <span className="text-indigo-600 font-semibold text-sm">
                      {firstName.charAt(0)}{lastName.charAt(0) || firstName.charAt(1) || ''}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-gray-800 leading-tight">
                      {candidateName}
                    </h2>
                    {/* <p className="text-xs text-gray-500">
                      {r.filename}
                    </p> */}
                  </div>
                </div>
                <div className="text-right">
                  <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                    {(r.similarity_score * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Category:</span>
                  <span className="text-sm font-medium text-gray-800 bg-gray-100 px-2 py-1 rounded">
                    {r.job_category}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Uploaded:</span>
                  <span className="text-sm text-gray-800">
                    {new Date(r.upload_timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Preview */}
              <div className="border-t pt-3">
                <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                  {r.text_preview}
                </p>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-3 border-t">
                <button 
                  onClick={() => openResumeModal(r)}
                  className="w-full hover:cursor-pointer bg-black hover:bg-orange-600 hover:text-white active:bg-orange-700 text-orange-600 font-bold py-2 px-4 rounded-lg text-sm font-extrabold transition"
                >
                  View Full Resume
                </button>
              </div>
            </div>
          );
        })}

        {!loading && uniqueResults.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg mb-2">
              {query
                ? "No matching resumes found."
                : "Enter a Job Description above to start searching."}
            </p>
            {query && (
              <p className="text-gray-400 text-sm">
                Try adjusting your search criteria or lowering the similarity threshold.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resume Modal */}
      {selectedResume && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">
                    {extractFirstLastName(selectedResume.filename).firstName.charAt(0)}
                    {extractFirstLastName(selectedResume.filename).lastName.charAt(0) || 
                     extractFirstLastName(selectedResume.filename).firstName.charAt(1) || ''}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {extractCandidateName(selectedResume.filename)}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedResume.job_category} • {(selectedResume.similarity_score * 100).toFixed(1)}% Match
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600">Loading resume...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Resume Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Category:</span>
                      <p className="text-sm text-gray-800">{selectedResume.job_category}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Uploaded:</span>
                      <p className="text-sm text-gray-800">
                        {new Date(selectedResume.upload_timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Similarity:</span>
                      <p className="text-sm text-gray-800">
                        {(selectedResume.similarity_score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Resume Content */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Resume Content</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed">
                        {resumeContent}
                      </pre>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => downloadResume(selectedResume)}
                      disabled={downloadLoading}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition"
                    >
                      {downloadLoading ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>📄 Download Original</>
                      )}
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
