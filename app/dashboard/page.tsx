// File: /opt/resume-matching-system/frontend/app/dashboard/page.tsx
"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AuthWrapper from "@/components/Layout/AuthWrapper";
import { 
  ChartBarIcon, 
  MagnifyingGlassIcon, 
  ArrowUpTrayIcon,
  CubeIcon,
  HeartIcon,
  RocketLaunchIcon
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const quickActions = [
    {
      title: "Upload Resumes",
      description: "Add new resumes to your database",
      icon: ArrowUpTrayIcon,
      color: "bg-blue-500",
      path: "/upload"
    },
    {
      title: "Search Candidates",
      description: "Find the perfect match for your job",
      icon: MagnifyingGlassIcon,
      color: "bg-green-500",
      path: "/search"
    },
    {
      title: "View Analytics",
      description: "Monitor usage and insights",
      icon: ChartBarIcon,
      color: "bg-orange-500",
      path: "/analytics"
    },
    {
      title: "Test Analytics",
      description: "Test the analytics system",
      icon: RocketLaunchIcon,
      color: "bg-purple-500",
      path: "/test-analytics"
    },
    {
      title: "System Health",
      description: "Check system status",
      icon: HeartIcon,
      color: "bg-red-500",
      path: "/health"
    },
    {
      title: "MinIO Storage",
      description: "Manage file storage",
      icon: CubeIcon,
      color: "bg-indigo-500",
      path: "/minio"
    }
  ];

  const handleActionClick = (path: string) => {
    if (path === "/minio") {
      window.open("http://localhost:9001/browser/resumes", "_blank");
    } else {
      router.push(path);
    }
  };

  return (
    <AuthWrapper>
      <div className="p-6 lg:p-8 min-h-screen">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black dark:text-white mb-2">
            Welcome back, {session?.user?.name}! 👋
          </h1>
          <p className="text-black dark:text-white text-lg">
            Your AI-powered resume matching platform is ready to help you find the perfect candidates.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Searches</p>
                <p className="text-2xl font-bold text-black">0</p>
                <p className="text-sm text-green-600">+0% from last month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <MagnifyingGlassIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Downloads</p>
                <p className="text-2xl font-bold text-black">0</p>
                <p className="text-sm text-green-600">+0% from last month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ArrowUpTrayIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Sessions</p>
                <p className="text-2xl font-bold text-black">1</p>
                <p className="text-sm text-orange-600">Current session</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <ChartBarIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-black mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action.path)}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-left hover:shadow-md transition-all duration-200 hover:-translate-y-1 group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 ${action.color} rounded-lg group-hover:scale-110 transition-transform`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-black group-hover:text-orange-600 transition-colors">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-black mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-full">
                <RocketLaunchIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-black">System Initialized</p>
                <p className="text-sm text-gray-600">Analytics system is ready for use</p>
              </div>
              <div className="ml-auto text-sm text-gray-500">Just now</div>
            </div>
            
            <div className="text-center py-8 text-gray-500">
              <p>Start using the platform to see your activity here</p>
            </div>
          </div>
        </div>
      </div>
    </AuthWrapper>
  );
}