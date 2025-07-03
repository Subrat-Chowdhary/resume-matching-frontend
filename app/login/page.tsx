"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Logo from "@/public/ahom.png"

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    if (res?.error) setError(res.error);
    else router.push("/");
  }

  return (
<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-stone-900 to-gray-900">
      <div className="flex flex-col max-w-sm w-full mx-auto p-10 bg-white items-center justify-center rounded-xl shadow-lg">
        <Image alt="Logo" src={Logo} className="w-3/4 h-auto mb-4" />
        <h1 className="text-gray-800 text-3xl mb-4"><span className="text-orange-600 font-bold">AI </span>Resume Matcher</h1>
        {/* <h2 className="text-2xl mb-4 text-orange-500 font-extrabold m-4">Login</h2> */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full ">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="border p-2 rounded text-black"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="border p-2 rounded text-black"
          />
          {error && <div className="text-red-500">{error}</div>}
          <button className="bg-black hover:bg-orange-600 text-white font-bold p-2 rounded-full cursor-pointer">Login</button>
        </form>
        <div className="mt-4 text-center text-orange-500 font-bold">
          New user? <a className="text-blue-600 underline font-normal" href="/register">Register here</a>
        </div>
      </div>
    </div>
  );
}
