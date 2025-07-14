// File: /opt/resume-matching-system/frontend/app/search/page.tsx
"use client";

import React, { useState, useMemo, useEffect } from "react";
import { API_ENDPOINTS, JOB_CATEGORIES, RESUME_TEMPLATES, TEMPLATE_DESCRIPTIONS, type JobCategory, type ResumeTemplate, type SearchResult, type SearchResponse, extractFirstLastName, getInitials, formatSkills, getLatestCompany, truncateText } from "@/lib/api";

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
  const [selectedTemplate, setSelectedTemplate] = useState<ResumeTemplate>("professional");
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);

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

  // Toggle template options
  const toggleTemplateOptions = () => {
    setShowTemplateOptions(prev => !prev);
  };

  // Select template and download
  const selectTemplateAndDownload = (template: ResumeTemplate) => {
    setSelectedTemplate(template);
    if (selectedResume) {
      downloadResume(selectedResume, template);
    }
    setShowTemplateOptions(false);
  };

  // Download function - Call API to generate and download resume
  const downloadResume = async (resume: SearchResult, template: ResumeTemplate = selectedTemplate) => {
    console.log(`Download button clicked for: ${resume.name} with template: ${template}`);
    
    setDownloadLoading(true);
    
    try {
      // Create form data for the request
      const formData = new FormData();
      formData.append('resume_ids', resume.id); // Single ID as string
      formData.append('template', template); // Use 'template' as the parameter name
      
      // Call the API to generate the resume document
      const response = await fetch(API_ENDPOINTS.DOWNLOAD_SELECTED_RESUMES, {
        method: 'POST',
        body: formData, // Send as form data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        
        // Check for the specific NoneType error or any document generation error
        if (errorText.includes("'NoneType' object has no attribute 'save'") || 
            errorText.includes("Failed to generate document") ||
            errorText.includes("Download failed")) {
          
          // Log the error for debugging
          console.error("Document generation error:", errorText);
          
          // Show a more helpful error message
          const errorMessage = "The resume document could not be generated. This may be due to missing data or a backend configuration issue.";
          
          // Automatically download as text instead of showing confirmation dialog
          try {
            // Create a text file with the resume content
            const textContent = formatResumeAsText(resume);
            const textBlob = new Blob([textContent], { type: 'text/plain' });
            const textUrl = URL.createObjectURL(textBlob);
            
            // Create download link for text file
            const link = document.createElement('a');
            link.href = textUrl;
            link.download = `${resume.name.replace(/\s+/g, '_')}_Resume.txt`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(textUrl);
            
            // Show success message
            alert(`${errorMessage}\n\nA text version of the resume has been downloaded instead.`);
          } catch (textError) {
            console.error("Error creating text file:", textError);
            alert(`${errorMessage}\n\nPlease use the "Download as Text" button instead.`);
          }
          
          return;
        }
        
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      // Get the blob from the response
      const blob = await response.blob();
      
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(blob);
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      
      // Set the filename based on the template and candidate name
      const templatePrefix = template.charAt(0).toUpperCase() + template.slice(1);
      link.download = `${templatePrefix}_Resume_${resume.name.replace(/\s+/g, '_')}.docx`;
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
  
  // Helper function to format resume as text
  const formatResumeAsText = (resume: SearchResult): string => {
    return `
RESUME: ${resume.name}
====================

CONTACT INFORMATION
------------------
Name: ${resume.name}
Email: ${resume.email_id}
Phone: ${resume.phone_number || 'Not provided'}
Location: ${resume.location}
LinkedIn: ${resume.linkedin_url || 'Not provided'}
GitHub: ${resume.github_url || 'Not provided'}

PROFESSIONAL SUMMARY
------------------
Current Job Title: ${resume.current_job_title}
Objective: ${resume.objective}

SKILLS
------
${resume.skills.join(', ')}

EXPERIENCE
----------
${resume.experience_summary}

Companies:
${resume.companies_worked_with_duration.join('\n')}

QUALIFICATIONS
-------------
${resume.qualifications_summary}

PROJECTS
--------
${resume.projects.length > 0 ? resume.projects.join('\n\n') : 'No projects listed'}

CERTIFICATIONS
-------------
${resume.certifications.length > 0 ? resume.certifications.join('\n') : 'No certifications listed'}

AWARDS & ACHIEVEMENTS
-------------------
${resume.awards_achievements.length > 0 ? resume.awards_achievements.join('\n') : 'No awards listed'}

LANGUAGES
--------
${resume.languages.join(', ')}

AVAILABILITY & WORK STATUS
------------------------
Availability Status: ${resume.availability_status || 'Not specified'}
Work Authorization: ${resume.work_authorization_status || 'Not specified'}
`;
  };

  // Preview template function
  const previewTemplate = async () => {
    if (!selectedResume) return;
    
    setPreviewMode(true);
    setPreviewLoading(true);
    
    try {
      // Here we could call an API endpoint to get a preview image
      // For now, we'll just simulate a loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you might fetch a preview image from the API
      // and display it in the modal
    } catch (error) {
      console.error("Error loading preview:", error);
      alert("Failed to load preview. Please try again.");
    } finally {
      setPreviewLoading(false);
    }
  };
  
  // Close preview
  const closePreview = () => {
    setPreviewMode(false);
  };

  const closeModal = () => {
    setSelectedResume(null);
    setResumeContent("");
    setDownloadLoading(false);
    setShowTemplateOptions(false);
    setPreviewMode(false);
    setSelectedTemplate("professional"); // Reset to default template
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
                              className="bg-yellow-50 dark:bg-slate-800 px-3 py-2 rounded-md text-sm text-gray-700"
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
                  <div className="space-y-4 pt-4 border-t">
                    {/* Note about document generation */}
                    {/* <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <div className="flex items-start">
                        <div className="text-yellow-600 text-xl mr-2">⚠️</div>
                        <div>
                          <p className="text-sm text-yellow-800 font-medium">Document Generation Notice</p>
                          <p className="text-xs text-yellow-700 mt-1">
                            The Word document generation feature is currently experiencing issues. 
                            For reliable resume downloads, please use the "Download as Text" option below.
                          </p>
                        </div>
                      </div>
                    </div> */}
                    
                    {/* Template Selection */}
                    <div className="relative">
                      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200 mb-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Template Style:</span>
                          <div className="flex items-center">
                            <span className="text-md font-semibold text-gray-900 capitalize">{selectedTemplate}</span>
                            <span className="ml-2 text-xs text-gray-500">{TEMPLATE_DESCRIPTIONS[selectedTemplate]}</span>
                          </div>
                        </div>
                        <button
                          onClick={toggleTemplateOptions}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          {showTemplateOptions ? 'Hide Options' : 'Change Template'}
                        </button>
                      </div>
                      
                      {/* Template Options */}
                      {showTemplateOptions && (
                        <div className="absolute z-10 w-full bg-white rounded-lg shadow-xl border border-gray-200 p-4 mt-1">
                          <div className="text-sm font-medium text-gray-700 mb-3 px-2">Select a template style:</div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {RESUME_TEMPLATES.map((template) => (
                              <button
                                key={template}
                                onClick={() => selectTemplateAndDownload(template)}
                                className={`flex items-start p-4 rounded-lg transition ${
                                  selectedTemplate === template 
                                    ? 'bg-white border-2 border-blue-300' 
                                    : 'dark:hover:bg-gray-600 hover:bg-gray-100 border border-gray-200'
                                }`}
                              >
                                {/* Template Preview */}
                                <div className={`w-16 h-20 mr-4 flex-shrink-0 border ${
                                  selectedTemplate === template ? 'border-blue-300' : 'border-gray-300'
                                } rounded overflow-hidden`}>
                                  {template === 'professional' && (
                                    <div className="h-full w-full bg-white flex flex-col">
                                      <div className="h-4 bg-blue-600 w-full"></div>
                                      <div className="flex-1 p-1">
                                        <div className="h-2 w-3/4 bg-gray-300 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-2 w-1/2 bg-gray-300 mt-2"></div>
                                        <div className="h-1 w-full bg-gray-200 mt-1"></div>
                                      </div>
                                    </div>
                                  )}
                                  {template === 'modern' && (
                                    <div className="h-full w-full bg-white flex">
                                      <div className="w-1/3 bg-gray-700"></div>
                                      <div className="w-2/3 p-1">
                                        <div className="h-2 w-3/4 bg-gray-300 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-2 w-1/2 bg-gray-300 mt-2"></div>
                                        <div className="h-1 w-full bg-gray-200 mt-1"></div>
                                      </div>
                                    </div>
                                  )}
                                  {template === 'compact' && (
                                    <div className="h-full w-full bg-white flex flex-col">
                                      <div className="h-3 bg-orange-500 w-full"></div>
                                      <div className="flex-1 p-1">
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                        <div className="h-1 w-full bg-gray-200 mb-1"></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                {/* Template Info */}
                                <div className="flex flex-col items-start text-left flex-1">
                                  <span className={`font-medium capitalize text-lg ${selectedTemplate === template ? 'text-blue-700' : 'text-gray-800'}`}>
                                    {template}
                                  </span>
                                  <span className="text-sm text-gray-600 mt-1">{TEMPLATE_DESCRIPTIONS[template]}</span>
                                  
                                  {selectedTemplate === template && (
                                    <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Selected
                                    </span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Preview Mode */}
                    {previewMode && (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-lg font-semibold text-gray-800">Template Preview: <span className="capitalize">{selectedTemplate}</span></h3>
                          <button 
                            onClick={closePreview}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            ✕ Close Preview
                          </button>
                        </div>
                        
                        {previewLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
                            <span className="ml-3 text-gray-600">Loading preview...</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            {/* Template Preview Mockup */}
                            <div className="w-full max-w-md aspect-[3/4] bg-white border border-gray-300 shadow-lg mb-4 overflow-hidden">
                              {selectedTemplate === 'professional' && (
                                <div className="h-full flex flex-col">
                                  <div className="bg-blue-600 text-white p-6">
                                    <div className="text-2xl font-bold mb-1">{selectedResume.name}</div>
                                    <div className="text-sm opacity-90">{selectedResume.current_job_title} | {selectedResume.email_id} | {selectedResume.location}</div>
                                  </div>
                                  <div className="flex-1 p-6">
                                    <div className="border-b border-gray-300 pb-2 mb-4">
                                      <div className="font-bold text-gray-800 mb-2">PROFESSIONAL SUMMARY</div>
                                      <div className="bg-gray-100 h-16 rounded"></div>
                                    </div>
                                    <div className="border-b border-gray-300 pb-2 mb-4">
                                      <div className="font-bold text-gray-800 mb-2">SKILLS</div>
                                      <div className="flex flex-wrap gap-2">
                                        {selectedResume.skills.slice(0, 6).map((skill, i) => (
                                          <div key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">{skill}</div>
                                        ))}
                                      </div>
                                    </div>
                                    <div className="border-b border-gray-300 pb-2 mb-4">
                                      <div className="font-bold text-gray-800 mb-2">EXPERIENCE</div>
                                      <div className="space-y-2">
                                        {selectedResume.companies_worked_with_duration.slice(0, 2).map((company, i) => (
                                          <div key={i} className="bg-gray-100 h-8 rounded"></div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {selectedTemplate === 'modern' && (
                                <div className="h-full flex">
                                  <div className="w-1/3 bg-gray-800 text-white p-4">
                                    <div className="text-lg font-bold mb-6 border-b border-gray-600 pb-2">{selectedResume.name.split(' ')[0]}<br/>{selectedResume.name.split(' ').slice(1).join(' ')}</div>
                                    <div className="text-sm mb-4">
                                      <div className="mb-1 opacity-80">Contact</div>
                                      <div className="text-xs mb-3 opacity-90">{selectedResume.email_id}<br/>{selectedResume.location}</div>
                                      
                                      <div className="mb-1 opacity-80">Skills</div>
                                      <div className="text-xs space-y-1">
                                        {selectedResume.skills.slice(0, 5).map((skill, i) => (
                                          <div key={i} className="bg-gray-700 px-2 py-1 rounded text-xs">{skill}</div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="w-2/3 p-4">
                                    <div className="text-xl font-bold text-gray-800 mb-2">{selectedResume.current_job_title}</div>
                                    <div className="text-sm text-gray-600 mb-4">{selectedResume.objective.substring(0, 60)}...</div>
                                    
                                    <div className="mb-4">
                                      <div className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">EXPERIENCE</div>
                                      <div className="space-y-2 mt-2">
                                        {selectedResume.companies_worked_with_duration.slice(0, 2).map((company, i) => (
                                          <div key={i} className="bg-gray-100 h-8 rounded"></div>
                                        ))}
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <div className="font-bold text-gray-800 mb-2 border-b border-gray-300 pb-1">EDUCATION</div>
                                      <div className="bg-gray-100 h-8 rounded mt-2"></div>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {selectedTemplate === 'compact' && (
                                <div className="h-full flex flex-col">
                                  <div className="bg-orange-500 text-white p-3">
                                    <div className="text-lg font-bold">{selectedResume.name}</div>
                                    <div className="text-xs">{selectedResume.current_job_title} | {selectedResume.email_id}</div>
                                  </div>
                                  <div className="flex-1 p-3 text-sm">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <div className="font-bold text-gray-800 text-xs mb-1">SKILLS</div>
                                        <div className="flex flex-wrap gap-1 mb-2">
                                          {selectedResume.skills.slice(0, 4).map((skill, i) => (
                                            <div key={i} className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded text-xs">{skill}</div>
                                          ))}
                                        </div>
                                        
                                        <div className="font-bold text-gray-800 text-xs mb-1 mt-2">EXPERIENCE</div>
                                        <div className="space-y-1">
                                          {selectedResume.companies_worked_with_duration.slice(0, 2).map((company, i) => (
                                            <div key={i} className="bg-gray-100 h-4 rounded"></div>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      <div>
                                        <div className="font-bold text-gray-800 text-xs mb-1">EDUCATION</div>
                                        <div className="bg-gray-100 h-4 rounded mb-2"></div>
                                        
                                        <div className="font-bold text-gray-800 text-xs mb-1 mt-2">CERTIFICATIONS</div>
                                        <div className="space-y-1">
                                          {selectedResume.certifications.slice(0, 2).map((cert, i) => (
                                            <div key={i} className="bg-gray-100 h-4 rounded"></div>
                                          ))}
                                          {selectedResume.certifications.length === 0 && (
                                            <div className="bg-gray-100 h-4 rounded"></div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div className="text-sm text-gray-600 italic">
                              This is a visual representation. The actual document may vary.
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => downloadResume(selectedResume)}
                        disabled={downloadLoading}
                        className="flex-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition"
                      >
                        {downloadLoading ? (
                          <div className="flex items-center justify-center">
                            <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                            <span>Generating Document...</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <span className="text-xl mr-2">📄</span>
                            <span>Download as Word Document</span>
                          </div>
                        )}
                      </button>
                      
                      {/* Text Download Option */}
                      <button
                        onClick={() => {
                          try {
                            const textContent = formatResumeAsText(selectedResume);
                            const textBlob = new Blob([textContent], { type: 'text/plain' });
                            const textUrl = URL.createObjectURL(textBlob);
                            
                            const link = document.createElement('a');
                            link.href = textUrl;
                            link.download = `${selectedResume.name.replace(/\s+/g, '_')}_Resume.txt`;
                            link.style.display = 'none';
                            
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                            
                            URL.revokeObjectURL(textUrl);
                            
                            // Show success message
                            alert("Text version of the resume has been downloaded successfully!");
                          } catch (error) {
                            console.error("Error downloading text resume:", error);
                            alert("Failed to download text resume. Please try again.");
                          }
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition flex-1"
                      >
                        <div className="flex items-center justify-center">
                          <span className="text-xl mr-2">📝</span>
                          <span>Download as Text (Reliable)</span>
                        </div>
                      </button>
                      
                      {!previewMode && (
                        <button
                          onClick={previewTemplate}
                          disabled={previewLoading}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition"
                        >
                          <span className="text-xl">👁️</span>
                        </button>
                      )}
                      
                      <button
                        onClick={() => deleteResume(selectedResume.id)}
                        className="bg-red-500 hover:bg-red-600 text-white py-3 px-4 rounded-lg font-medium transition"
                      >
                        <span className="text-xl">🗑️</span>
                      </button>
                      
                      <button
                        onClick={closeModal}
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition"
                      >
                        Close
                      </button>
                    </div>
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
