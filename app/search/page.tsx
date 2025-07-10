// File: /opt/resume-matching-system/frontend/app/search/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { API_ENDPOINTS, JOB_CATEGORIES, type JobCategory, type SearchResult, type SearchResponse, extractFirstLastName, getInitials, formatSkills, getLatestCompany, truncateText } from "@/lib/api";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [jobCategory, setJobCategory] = useState<JobCategory | "">("");
  const [threshold, setThreshold] = useState(0.7);
  const [limit, setLimit] = useState(10);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [selectedResume, setSelectedResume] = useState<SearchResult | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [resumeContent, setResumeContent] = useState<string>("");
  const [downloadLoading, setDownloadLoading] = useState(false);

  // remove duplicates by id
  const uniqueResults = useMemo(() => {
    const seen = new Set<string>();
    return results.filter((r) => {
      if (seen.has(r.id)) return false;
      seen.add(r.id);
      return true;
    });
  }, [results]);

  const handleSearch = async () => {
    setLoading(true);
    setResults([]);
    try {
      const formData = new FormData();
      formData.append("query", query.trim());
      if (jobCategory) {
        formData.append("job_category", jobCategory);
      }
      formData.append("limit", limit.toString());
      formData.append("similarity_threshold", threshold.toString());

      const res = await fetch(API_ENDPOINTS.SEARCH_PROFILE, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text}`);
      }

      const data: SearchResponse = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      console.error(err);
      alert("Search failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete function
  const deleteResume = async (resumeId: string) => {
    if (!confirm("Are you sure you want to delete this resume? This action cannot be undone.")) {
      return;
    }

    try {
      // Remove from current results
      setResults(prev => prev.filter(r => r.id !== resumeId));
      
      // Close modal if the deleted resume was selected
      if (selectedResume?.id === resumeId) {
        closeModal();
      }
      
      // Note: Add actual API call to delete from backend if needed
      // const deleteRes = await fetch(`${API_BASE_URL}/delete_resume/${resumeId}`, {
      //   method: "DELETE",
      // });
      
      alert("Resume deleted successfully!");
    } catch (error) {
      console.error("Error deleting resume:", error);
      alert("Failed to delete resume. Please try again.");
    }
  };

  // Modal functions
  const openResumeModal = async (resume: SearchResult) => {
    setSelectedResume(resume);
    setModalLoading(true);
    setResumeContent("");
    
    try {
      // Create a comprehensive formatted resume content from all available data
      const formattedContent = `
CANDIDATE PROFILE
================

Personal Information:
Name: ${resume.name}
Email: ${resume.email_id}
Phone: ${resume.phone_number || 'Not provided'}
Location: ${resume.location}
Current Job Title: ${resume.current_job_title}

LinkedIn: ${resume.linkedin_url || 'Not provided'}
GitHub: ${resume.github_url || 'Not provided'}
Has Photo: ${resume.has_photo ? 'Yes' : 'No'}

OBJECTIVE
=========
${resume.objective}

SKILLS
======
${resume.skills.join(', ')}

EXPERIENCE SUMMARY
==================
${resume.experience_summary}

QUALIFICATIONS
==============
${resume.qualifications_summary}

COMPANIES WORKED WITH
=====================
${resume.companies_worked_with_duration.join('\n')}

PROJECTS
========
${resume.projects.length > 0 ? resume.projects.join('\n') : 'No projects listed'}

CERTIFICATIONS
==============
${resume.certifications.length > 0 ? resume.certifications.join('\n') : 'No certifications listed'}

AWARDS & ACHIEVEMENTS
====================
${resume.awards_achievements.length > 0 ? resume.awards_achievements.join('\n') : 'No awards listed'}

LANGUAGES
=========
${resume.languages.join(', ')}

AVAILABILITY & WORK STATUS
==========================
Availability Status: ${resume.availability_status || 'Not specified'}
Work Authorization: ${resume.work_authorization_status || 'Not specified'}

METADATA
========
Original Filename: ${resume._original_filename}
Is Master Record: ${resume._is_master_record ? 'Yes' : 'No'}
Duplicate Count: ${resume._duplicate_count}
Duplicate Group ID: ${resume._duplicate_group_id}
Associated Files: ${resume._associated_original_filenames.join(', ')}
Associated IDs: ${resume._associated_ids.join(', ')}

Personal Details: ${resume.personal_details || 'Not available'}
Personal Info: ${resume.personal_info || 'Not available'}
      `.trim();
      
      setResumeContent(formattedContent);
    } catch (error) {
      console.error("Error loading resume:", error);
      setResumeContent("Error loading resume content");
    } finally {
      setModalLoading(false);
    }
  };

  // Download function - Generate comprehensive resume file
  const downloadResume = async (resume: SearchResult) => {
    console.log("Download button clicked for:", resume.name);
    
    setDownloadLoading(true);
    
    try {
      // Create comprehensive formatted resume content
      const resumeText = `
CANDIDATE PROFILE
================

Personal Information:
Name: ${resume.name}
Email: ${resume.email_id}
Phone: ${resume.phone_number || 'Not provided'}
Location: ${resume.location}
Current Job Title: ${resume.current_job_title}

LinkedIn: ${resume.linkedin_url || 'Not provided'}
GitHub: ${resume.github_url || 'Not provided'}
Has Photo: ${resume.has_photo ? 'Yes' : 'No'}

OBJECTIVE
=========
${resume.objective}

SKILLS
======
${resume.skills.join(', ')}

EXPERIENCE SUMMARY
==================
${resume.experience_summary}

QUALIFICATIONS
==============
${resume.qualifications_summary}

COMPANIES WORKED WITH
=====================
${resume.companies_worked_with_duration.join('\n')}

PROJECTS
========
${resume.projects.length > 0 ? resume.projects.join('\n') : 'No projects listed'}

CERTIFICATIONS
==============
${resume.certifications.length > 0 ? resume.certifications.join('\n') : 'No certifications listed'}

AWARDS & ACHIEVEMENTS
====================
${resume.awards_achievements.length > 0 ? resume.awards_achievements.join('\n') : 'No awards listed'}

LANGUAGES
=========
${resume.languages.join(', ')}

AVAILABILITY & WORK STATUS
==========================
Availability Status: ${resume.availability_status || 'Not specified'}
Work Authorization: ${resume.work_authorization_status || 'Not specified'}

METADATA
========
Original Filename: ${resume._original_filename}
Is Master Record: ${resume._is_master_record ? 'Yes' : 'No'}
Duplicate Count: ${resume._duplicate_count}
Duplicate Group ID: ${resume._duplicate_group_id}
Associated Files: ${resume._associated_original_filenames.join(', ')}
Associated IDs: ${resume._associated_ids.join(', ')}

Personal Details: ${resume.personal_details || 'Not available'}
Personal Info: ${resume.personal_info || 'Not available'}

Generated on: ${new Date().toLocaleDateString()}
      `.trim();
      
      // Create a blob with the resume content
      const blob = new Blob([resumeText], { type: 'text/plain' });
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.name.replace(/\s+/g, '_')}_Complete_Resume.txt`;
      link.style.display = 'none';
      
      // Append to body, click, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the temporary URL
      URL.revokeObjectURL(url);
      console.log("Download completed successfully!");
      
    } catch (error) {
      console.error("Error downloading resume:", error);
      alert(`Failed to download resume: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDownloadLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedResume(null);
    setResumeContent("");
    setDownloadLoading(false);
  };

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedResume) {
        closeModal();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedResume]);

  return (
    <div className="min-h-screen  flex flex-col items-center py-10">
      {/* Search Card */}
      <div className="w-full max-w-3xl bg-white p-8 rounded-2xl shadow-lg">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          <span className="text-orange-500">AI </span>Resume Matcher
        </h1>

        {/* Job Description */}
        <textarea
          className="w-full p-4 border border-gray-300 rounded-md mb-4 bg-gray-100 text-gray-800 placeholder-gray-500"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          rows={4}
          placeholder="Paste or type the job description here..."
        />

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Job Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Job Category
            </label>
            <select
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-white text-gray-800 focus:ring-2 focus:ring-blue-200"
              value={jobCategory}
              onChange={(e) => setJobCategory(e.target.value as JobCategory | "")}
            >
              <option value="">All Categories</option>
              {JOB_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Max Results */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Results
            </label>
            <input
              type="number"
              min={1}
              max={100}
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100 text-gray-800 focus:ring-2 focus:ring-blue-200"
              placeholder="e.g. 5"
            />
          </div>

          {/* Similarity Threshold */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sensitivity: {threshold.toFixed(2)}
            </label>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-orange-600"
            />
          </div>
        </div>

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!query || loading}
          className="w-full bg-black hover:bg-orange-600 hover:text-white active:bg-orange-700 text-white py-3 rounded-md font-semibold transition disabled:opacity-50"
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {/* Results Grid */}
      <div className="w-full max-w-6xl m-10 grid grid-cols-1 sm:grid-cols-2">
        {uniqueResults.map((r) => {
          const initials = getInitials(r.name);
          const { displayed: displayedSkills, remaining: remainingSkills } = formatSkills(r.skills, 3);
          const latestCompany = getLatestCompany(r.companies_worked_with_duration);
          
          return (
            <div
              key={r.id}
              className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow hover:shadow-lg transition border-l-4 m-4 border-orange-600"
            >
              {/* Candidate Header */}
              <div className="flex items-center justify-between mb-4">
                {/* Left: Initials and Name */}
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center">
                    <span className="text-orange-500 font-semibold text-sm">
                      {initials}
                    </span>
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-gray-800 leading-tight">
                      {r.name}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {r.email_id}
                    </p>
                  </div>
                </div>

                {/* Right: Similarity Score */}
                <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-semibold">
                  {r.similarity_score ? (r.similarity_score * 100).toFixed(1) + '%' : 'Match'}
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 mb-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="text-gray-800 font-medium">
                    {r.phone_number || 'Not provided'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="text-gray-800 truncate max-w-[150px]" title={r.location}>
                    {truncateText(r.location, 20)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Title:</span>
                  <span className="text-gray-800 font-medium truncate max-w-[150px]" title={r.current_job_title}>
                    {truncateText(r.current_job_title, 20)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Company:</span>
                  <span className="text-gray-800 font-medium bg-gray-100 px-2 py-1 rounded truncate max-w-[150px]" title={latestCompany}>
                    {truncateText(latestCompany, 20)}
                  </span>
                </div>
              </div>

              {/* Additional Info */}
              {/* <div className="space-y-2 mb-4 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">LinkedIn:</span>
                  <span className="text-gray-800">
                    {r.linkedin_url ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">GitHub:</span>
                  <span className="text-gray-800">
                    {r.github_url ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Photo:</span>
                  <span className="text-gray-800">
                    {r.has_photo ? '✓' : '✗'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Availability:</span>
                  <span className="text-gray-800 truncate max-w-[100px]" title={r.availability_status || 'Not specified'}>
                    {truncateText(r.availability_status || 'Not specified', 15)}
                  </span>
                </div>
              </div> */}

              {/* Skills Preview */}
              <div className="border-t pt-3 mb-3">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Top Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {displayedSkills.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                    >
                      {truncateText(skill, 12)}
                    </span>
                  ))}
                  {remainingSkills > 0 && (
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      +{remainingSkills} more
                    </span>
                  )}
                </div>
              </div>

              {/* Experience Preview */}
              <div className="border-t pt-3 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-1">Experience:</h4>
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                  {truncateText(r.experience_summary, 100)}
                </p>
              </div>

              {/* Metadata */}
              {/* <div className="border-t pt-3 mb-4 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>File:</span>
                  <span className="truncate max-w-[150px]" title={r._original_filename}>
                    {truncateText(r._original_filename, 20)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Duplicates:</span>
                  <span>{r._duplicate_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Master:</span>
                  <span>{r._is_master_record ? '✓' : '✗'}</span>
                </div>
              </div> */}

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button 
                  onClick={() => openResumeModal(r)}
                  className="flex-1 bg-black hover:bg-orange-600 text-white py-2 px-3 rounded-lg text-sm font-semibold transition"
                >
                  View Full
                </button>
                <button 
                  onClick={() => deleteResume(r.id)}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-semibold transition"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}

        {!loading && uniqueResults.length === 0 && (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg mb-4">
              {query
                ? "No matching resumes found."
                : "Enter a Job Description above to start searching."}
            </p>
            {query && (
              <p className="text-gray-400 text-sm">
                Try adjusting your search criteria or lowering the similarity threshold.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Resume Modal */}
      {selectedResume && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div 
            className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">
                    {getInitials(selectedResume.name)}
                  </span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    {selectedResume.name}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {selectedResume.email_id} • {selectedResume.similarity_score ? (selectedResume.similarity_score * 100).toFixed(1) + '%' : 'N/A'} Match
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {modalLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                  <span className="ml-3 text-gray-600">Loading resume...</span>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Contact Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <span className="text-sm font-medium text-gray-600">Phone:</span>
                      <p className="text-sm text-gray-800">{selectedResume.phone_number || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Location:</span>
                      <p className="text-sm text-gray-800">{selectedResume.location}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Job Title:</span>
                      <p className="text-sm text-gray-800">{selectedResume.current_job_title}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">LinkedIn:</span>
                      <p className="text-sm text-gray-800">
                        {selectedResume.linkedin_url ? (
                          <a href={selectedResume.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Profile
                          </a>
                        ) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">GitHub:</span>
                      <p className="text-sm text-gray-800">
                        {selectedResume.github_url ? (
                          <a href={selectedResume.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            View Profile
                          </a>
                        ) : 'Not provided'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-600">Has Photo:</span>
                      <p className="text-sm text-gray-800">{selectedResume.has_photo ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                  {/* Objective Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Objective</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {selectedResume.objective}
                      </p>
                    </div>
                  </div>

                  {/* Skills Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Skills ({selectedResume.skills.length})</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.skills.map((skill, index) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Experience Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Experience Summary</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedResume.experience_summary}
                      </p>
                    </div>
                  </div>

                  {/* Qualifications Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Qualifications</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {selectedResume.qualifications_summary}
                      </p>
                    </div>
                  </div>

                  {/* Companies Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Companies ({selectedResume.companies_worked_with_duration.length})</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="space-y-2">
                        {selectedResume.companies_worked_with_duration.map((company, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 px-3 py-2 rounded-md text-sm text-gray-700"
                          >
                            {company}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Projects Section */}
                  <div>
                    <h3 className="text-lg font-semibold  mb-3">Projects ({selectedResume.projects.length})</h3>
                    <div className="border border-gray-200 rounded-lg p-4">
                      {selectedResume.projects.length > 0 ? (
                        <div className="space-y-2">
                          {selectedResume.projects.map((project, index) => (
                            <div
                              key={index}
                              className="dark:bg-slate-800 dark:text-gray-800 px-3 py-2 rounded-md text-sm text-gray-700"
                            >
                              {project}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No projects listed</p>
                      )}
                    </div>
                  </div>

                  {/* Certifications Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Certifications ({selectedResume.certifications.length})</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      {selectedResume.certifications.length > 0 ? (
                        <div className="space-y-2">
                          {selectedResume.certifications.map((cert, index) => (
                            <div
                              key={index}
                              className="bg-yellow-50 px-3 py-2 rounded-md text-sm text-gray-700"
                            >
                              {cert}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No certifications listed</p>
                      )}
                    </div>
                  </div>

                  {/* Awards & Achievements Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Awards & Achievements ({selectedResume.awards_achievements.length})</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      {selectedResume.awards_achievements.length > 0 ? (
                        <div className="space-y-2">
                          {selectedResume.awards_achievements.map((award, index) => (
                            <div
                              key={index}
                              className="bg-purple-50 px-3 py-2 rounded-md text-sm text-gray-700"
                            >
                              {award}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No awards listed</p>
                      )}
                    </div>
                  </div>

                  {/* Languages Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Languages ({selectedResume.languages.length})</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap gap-2">
                        {selectedResume.languages.map((language, index) => (
                          <span
                            key={index}
                            className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full"
                          >
                            {language}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Status Information */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Status Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <span className="text-sm font-medium text-gray-600">Availability Status:</span>
                        <p className="text-sm text-gray-800">{selectedResume.availability_status || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-600">Work Authorization:</span>
                        <p className="text-sm text-gray-800">{selectedResume.work_authorization_status || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Metadata Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3">Metadata</h3>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Original Filename:</span>
                          <p className="text-gray-800">{selectedResume._original_filename}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Is Master Record:</span>
                          <p className="text-gray-800">{selectedResume._is_master_record ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Duplicate Count:</span>
                          <p className="text-gray-800">{selectedResume._duplicate_count}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Duplicate Group ID:</span>
                          <p className="text-gray-800 text-xs">{selectedResume._duplicate_group_id}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Associated Files:</span>
                          <div className="mt-1 space-y-1">
                            {selectedResume._associated_original_filenames.map((filename, index) => (
                              <p key={index} className="text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded">
                                {filename}
                              </p>
                            ))}
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <span className="font-medium text-gray-600">Associated IDs:</span>
                          <div className="mt-1 space-y-1">
                            {selectedResume._associated_ids.map((id, index) => (
                              <p key={index} className="text-gray-800 text-xs bg-gray-100 px-2 py-1 rounded">
                                {id}
                              </p>
                            ))}
                          </div>
                        </div>
                        {selectedResume.personal_details && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-600">Personal Details:</span>
                            <p className="text-gray-800">{JSON.stringify(selectedResume.personal_details)}</p>
                          </div>
                        )}
                        {selectedResume.personal_info && (
                          <div className="md:col-span-2">
                            <span className="font-medium text-gray-600">Personal Info:</span>
                            <p className="text-gray-800">{JSON.stringify(selectedResume.personal_info)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={() => downloadResume(selectedResume)}
                      disabled={downloadLoading}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white py-2 px-4 rounded-lg font-medium transition"
                    >
                      {downloadLoading ? (
                        <>
                          <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Downloading...
                        </>
                      ) : (
                        <>📄 Download Complete Resume</>
                      )}
                    </button>
                    <button
                      onClick={() => deleteResume(selectedResume.id)}
                      className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition"
                    >
                      🗑️ Delete Resume
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg font-medium transition"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
