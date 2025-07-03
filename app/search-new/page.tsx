"use client";

import React, { useState } from "react";

export default function SearchNewPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
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
      const response = await fetch(
        `http://157.180.44.51:8000/search/search?query=${encodeURIComponent(
          trimmedQuery
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Add Authorization header here if backend requires token
            // "Authorization": `Bearer YOUR_TOKEN_HERE`
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }

      try {
        const data = await response.json();
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
          <ul>
            {results.map((item, idx) => (
              <li key={idx}>{JSON.stringify(item)}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
