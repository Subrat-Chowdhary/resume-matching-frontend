// File: app/health/page.tsx

"use client";
import React, { useEffect, useState } from "react";

type HealthStatus = {
  status?: string;
  error?: string;
};

export default function HealthPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://157.180.44.51:8000/health")
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        setHealth({ error: "Could not reach backend." });
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Backend Health Check (FastAPI)</h1>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <pre>{JSON.stringify(health, null, 2)}</pre>
      )}
    </div>
  );
}
