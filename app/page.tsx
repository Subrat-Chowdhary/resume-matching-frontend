// File: /opt/resume-matching-system/frontend/app/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import logo from "@/public/ahom.png";
import { AnimatePresence, motion } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

import UploadSection from "./upload/page";
import SearchSection from "./search/page";
import HealthSection from "./health/page";

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>("Upload");
  const { data: session, status } = useSession();
  const router = useRouter();

  // Redirect to /login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // While loading session, don't render anything (no flicker)
  if (status === "loading") {
    return null;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "Upload":
        return <UploadSection />;
      case "Search":
        return <SearchSection />;
      case "Health":
        return <HealthSection />;
      case "MinIO":
        return (
          <div className="flex items-center justify-center h-full">
            <button
              onClick={() =>
                window.open(
                  "http://157.180.44.51:9001/browser/resumes",
                  "_blank"
                )
              }
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow"
            >
              🔗 Open MinIO Console
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const tabs = [
    { name: "Upload", icon: "📤" },
    { name: "Search", icon: "🔍" },
    { name: "Health", icon: "🩺" },
    { name: "MinIO", icon: "📦" },
  ];

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-black-50 to-gray-800">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-screen w-64 bg-white text-black flex flex-col items-center py-8 space-y-8 shadow-lg z-20">
        <Image src={logo} width={120} height={84} alt="Logo" className="mb-2" />
        <h1 className="text-xl font-bold text-gray-700">
        <span className="text-orange-600">AI</span> Resume Matcher
        </h1>
        <nav className="flex flex-col space-y-4 px-2 w-full">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center w-full px-4 py-2 rounded-lg transition ${
                activeTab === tab.name
                  ? "bg-black text-white"
                  : "hover:bg-orange-500"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
        {/*Logout Button at Bottom */}
        <div className="absolute bottom-8 left-0 w-full flex flex-col py-2 p-2">

          <button
            onClick={() => signOut({ callbackUrl: "http://157.180.44.51:3000" })}
            className="group bg-black hover:bg-red-700 text-white font-bold py-1 px-6 rounded-lg shadow transition transform hover:-translate-y-1 focus:outline-none"
          >Log Out</button>
          {session && (

            <p className="text-xs mt-2">
              Signed in as <span className="text-gray-700"> {session.user.name}, {session.user.role} </span> <br/>Email: <span className="text-gray-700">{session.user.email}</span>
            </p>
          )

          }
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-0 overflow-hidden ml-64">
        <AnimatePresence>
          <motion.div
            key={activeTab}
            className="w-full h-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
