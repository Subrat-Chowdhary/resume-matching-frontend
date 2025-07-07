"use client";
import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Logo from "@/public/ahom.png"

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    // console.log('[Login] Attempting login with:', { email, callbackUrl });
    
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    
    // console.log('[Login] SignIn response:', res);
    
    setLoading(false);
    
    if (res?.error) {
      // console.log('[Login] Error:', res.error);
      setError("Invalid email or password");
    } else if (res?.ok) {
      // console.log('[Login] Success! Redirecting to:', callbackUrl);
      // Successful login - redirect to callback URL or home
      router.push(callbackUrl);
      router.refresh(); // Force refresh to update session
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100">
      <div className="flex flex-col max-w-md w-full mx-auto p-8 bg-white items-center justify-center rounded-2xl shadow-xl border border-gray-200">
        <Image alt="Logo" src={Logo} className="w-3/4 h-auto mb-4" />
        <h1 className="text-black text-3xl mb-2 font-bold">
          <span className="text-orange-600">AI</span> Resume Matcher
        </h1>
        <p className="text-gray-600 mb-8 text-center font-medium">
          Sign in to access your dashboard
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-6 w-full">
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full border-2 border-gray-300 p-4 rounded-xl text-black font-medium placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            />
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-black mb-2">Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full border-2 border-gray-300 p-4 rounded-xl text-black font-medium placeholder-gray-500 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl font-medium">
              {error}
            </div>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="btn-primary w-full p-4 rounded-xl font-bold text-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Signing In...</span>
              </div>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        <div className="mt-4 text-center text-orange-500 font-bold">
          New user? <a className="text-blue-600 underline font-normal" href="/register">Register here</a>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-gray-100">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
