// File: /opt/resume-matching-system/frontend/app/search/page.tsx
"use client";

import React, { useState, useMemo } from "react";

type Result = {
  id: string;
  name: string;
  file: string;
  email: string;
  phone: string;
  score: number;
  text: string;
};

export default function SearchSection() {
  const [jd, setJd] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);

  const uniqueResults = useMemo(() => {
    // Filter by file name for uniqueness (or by id if you trust it)
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.file)) return false;
      seen.add(r.file);
      return true;
    });
  }, [results]);

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const res = await fetch("http://157.180.44.51:8000/api/search_resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: jd }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Backend returns { results: [ ... ] }
      const mapped = (data.results || []).map((item: any) => ({
        id: item.id || item.file || item.name || Math.random().toString(36).slice(2),
        name: item.name || "Unknown",
        file: item.file || "",
        email: item.email || "",
        phone: item.phone || "",
        score: item.score ?? 0,
        text: item.text || "",
      }));
      setResults(mapped);
    } catch (err: any) {
      console.error(err);
      alert("Search failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-8">
      <div className="w-full max-w-3xl bg-white shadow-2xl rounded-2xl p-8 mt-6 border border-gray-200">
        <h1 className="text-3xl font-bold mb-2 text-center text-slate-800">
          <span className="text-orange-600">AI </span>Resume Matcher
        </h1>
        <div className="flex flex-col gap-2">
          <textarea
            value={jd}
            onChange={e => setJd(e.target.value)}
            rows={4}
            placeholder="Paste or type Job Description..."
            className="w-full p-4 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition text-lg resize-none bg-slate-50 text-gray-800"
          />
          <button
            onClick={handleSearch}
            disabled={!jd || loading}
            className="w-full md:w-auto self-end bg-black text-white px-8 py-2 mt-0 rounded-lg font-semibold hover:bg-orange-600 transition disabled:bg-gray-300 disabled:text-gray-600 mb-2"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin h-5 w-5 border-2 border-white border-r-blue-600 rounded-full"></span>
                Searching...
              </span>
            ) : "Search"}
          </button>
        </div>
      </div>

      {uniqueResults.length > 0 && (
        <div className="w-full max-w-5xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
          {uniqueResults.map(r => (
            <div
              key={r.id}
              className="bg-white border border-slate-100 shadow-lg rounded-2xl p-6 flex flex-col items-center hover:scale-[1.025] hover:shadow-blue-200 transition"
              title={r.text}
            >
              <div className="w-20 h-20 flex items-center justify-center rounded-full border-4 border-blue-100 shadow mb-4 object-cover text-3xl bg-slate-100 font-bold text-slate-700">
                {r.name ? r.name[0].toUpperCase() : "?"}
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-700">{r.name}</div>
                <div className="text-blue-600 font-semibold">
                  Score: <span className="text-xl">{(r.score * 100).toFixed(1)}%</span>
                </div>
                <div className="text-gray-700 mt-2">
                  <div><b>Email:</b> {r.email || <span className="text-gray-400">Unknown</span>}</div>
                  <div><b>Phone:</b> {r.phone || <span className="text-gray-400">Unknown</span>}</div>
                  <div><b>File:</b> {r.file}</div>
                  {/* Optionally, add preview/snippet */}
                  {r.text && (
                    <div className="mt-2 text-xs text-gray-500 border-t pt-2 truncate">
                      {r.text.slice(0, 120)}...
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && uniqueResults.length === 0 && (
        <div className="text-gray-200 mt-16 text-lg font-medium">
          {jd ? "No matching resumes found." : "Start by entering a Job Description above."}
        </div>
      )}
    </div>
  );
}
