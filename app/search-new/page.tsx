"use client";

import React, { useState } from "react";
import { API_ENDPOINTS, type SearchResult, type SearchResponse, extractCandidateName, extractFirstLastName } from "@/lib/api";

export default function SearchNewPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(event: React.FormEvent) {
    event.preventDefault();
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Please enter a search query.");
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const formData = new FormData();
      formData.append("query", trimmedQuery);
      formData.append("limit", "10");
      formData.append("similarity_threshold", "0.7");

      const response = await fetch(API_ENDPOINTS.SEARCH_PROFILE, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      try {
        const data: SearchResponse = await response.json();
        setResults(data.results || []);
      } catch {
        throw new Error("Failed to parse server response.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "Arial" }}>
      <h2 style={{ color: "#FF4500" }}>Search New</h2>

      <form onSubmit={handleSearch}>
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your search query"
          style={{ width: "100%", height: 100, padding: 10, fontSize: 16 }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 10,
            padding: "10px 20px",
            backgroundColor: "#000",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "Searching..." : "Search"}
        </button>
      </form>

      <div style={{ marginTop: 20 }}>
        {error && <p style={{ color: "red" }}>Error: {error}</p>}

        {!error && !loading && results.length === 0 && query.trim() && (
          <p>No matching resumes found.</p>
        )}

        {!error && !loading && !query.trim() && (
          <p>Enter a query to search resumes.</p>
        )}

        {results.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>Search Results:</h3>
            {results.map((item, idx) => {
              const candidateName = extractCandidateName(item.filename);
              const { firstName, lastName } = extractFirstLastName(item.filename);
              
              return (
                <div key={item.id || idx} style={{ 
                  border: "1px solid #ddd", 
                  padding: 20, 
                  margin: "15px 0", 
                  borderRadius: 12,
                  backgroundColor: "#fff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                }}>
                  {/* Header with candidate info */}
                  <div style={{ display: "flex", alignItems: "center", marginBottom: 15 }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      backgroundColor: "#4F46E5",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                      color: "white",
                      fontWeight: "bold",
                      fontSize: 14
                    }}>
                      {firstName.charAt(0)}{lastName.charAt(0) || firstName.charAt(1) || ''}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: "0 0 4px 0", color: "#333", fontSize: 18, fontWeight: "bold" }}>
                        {candidateName}
                      </h4>
                      <p style={{ margin: 0, fontSize: 12, color: "#666" }}>
                        {item.filename}
                      </p>
                    </div>
                    <div style={{
                      backgroundColor: "#10B981",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: "bold"
                    }}>
                      {(item.similarity_score * 100).toFixed(1)}%
                    </div>
                  </div>

                  {/* Details */}
                  <div style={{ marginBottom: 15 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 14, color: "#666" }}>Category:</span>
                      <span style={{ 
                        fontSize: 14, 
                        fontWeight: "500", 
                        backgroundColor: "#F3F4F6", 
                        padding: "2px 8px", 
                        borderRadius: 4 
                      }}>
                        {item.job_category}
                      </span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 14, color: "#666" }}>Uploaded:</span>
                      <span style={{ fontSize: 14, color: "#333" }}>
                        {new Date(item.upload_timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Preview */}
                  <div style={{ 
                    borderTop: "1px solid #E5E7EB", 
                    paddingTop: 12,
                    fontSize: 12, 
                    color: "#666",
                    lineHeight: 1.5
                  }}>
                    {item.text_preview}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
