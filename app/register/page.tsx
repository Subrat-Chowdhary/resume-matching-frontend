"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { UserPlusIcon, EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Logo from "@/public/ahom.png"

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    
    setLoading(false);
    
    if (!res.ok) {
      setError(data.error || "Failed to register");
    } else {
      router.push("/login?message=Registration successful! Please sign in.");
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700 p-8 backdrop-blur-sm">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <Image 
                  alt="Logo" 
                  src={Logo} 
                  className="" 
                  width={200}
                  height={200}
                />
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full flex items-center justify-center">
                  <UserPlusIcon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
            <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
              <span className="text-orange-600">AI</span> Resume Matcher
            </h1>
            <p className="text-gray-600 dark:text-gray-300 font-medium">
              Create your account to get started
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Full Name
              </label>
              <input
                type="text" 
                placeholder="Enter your full name" 
                value={name}
                onChange={e => setName(e.target.value)} 
                required
                className="w-full border-2 border-gray-300 dark:border-gray-600 p-4 rounded-xl text-black dark:text-white bg-white dark:bg-gray-800 font-medium placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all"
              />
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Email Address
              </label>
              <input
                type="email" 
                placeholder="Enter your email address" 
                value={email}
                onChange={e => setEmail(e.target.value)} 
                required
                className="w-full border-2 border-gray-300 dark:border-gray-600 p-4 rounded-xl text-black dark:text-white bg-white dark:bg-gray-800 font-medium placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all"
              />
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-black dark:text-white mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} 
                  placeholder="Create a strong password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)} 
                  required
                  className="w-full border-2 border-gray-300 dark:border-gray-600 p-4 pr-12 rounded-xl text-black dark:text-white bg-white dark:bg-gray-800 font-medium placeholder-gray-500 dark:placeholder-gray-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:focus:ring-orange-800 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl font-medium"
              >
                {error}
              </motion.div>
            )}
            
            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="btn-primary w-full p-4 rounded-xl font-bold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <UserPlusIcon className="h-5 w-5" />
                  <span>Create Account</span>
                </div>
              )}
            </button>
          </form>
          
          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <a 
                className="text-orange-600 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-300 font-semibold underline transition-colors" 
                href="/login"
              >
                Sign in here
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
