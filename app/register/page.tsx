"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/public/ahom.png"

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (!res.ok) setError(data.error || "Failed to register");
    else router.push("/login");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 to-gray-900">
        <div className="flex flex-col max-w-sm w-full mx-auto p-4 bg-white text-black items-center justify-center rounded-xl shadow-lg">
        <Image alt="Logo" src={Logo} className="w-3/4 h-auto mb-4" />
        <h1 className="text-gray-800 text-3xl mb-4"><span className="text-orange-600 font-bold">AI</span> Resume Matcher</h1>
        
        {/* <h2 className="text-2xl mb-4">Register</h2> */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <input
            type="text" placeholder="Name" value={name}
            onChange={e => setName(e.target.value)} required
            className="border p-2 rounded"
            />
            <input
            type="email" placeholder="Email" value={email}
            onChange={e => setEmail(e.target.value)} required
            className="border p-2 rounded"
            />
            <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)} required
            className="border p-2 rounded"
            />
            {error && <div className="text-red-500">{error}</div>}
            <button className="bg-black text-white p-2 hover:bg-orange-500 rounded-full font-bold">Register</button>
        </form>
        <div className="mt-4 text-center">
            Already registered? <a className="text-blue-600 underline" href="/login">Login here</a>
        </div>
        </div>
    </div>
  );
}
