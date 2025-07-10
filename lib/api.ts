// API Configuration
export const API_BASE_URL = "http://localhost:8000";

// API Endpoints
export const API_ENDPOINTS = {
  UPLOAD_PROFILE: `${API_BASE_URL}/upload_profile`,
  SEARCH_PROFILE: `${API_BASE_URL}/search_profile`,
  DOWNLOAD_RESUME: `/api/download-resume`, // Use Next.js API route instead of backend
  HEALTH: `${API_BASE_URL}/health`,
} as const;

// Job Categories as per backend API
export const JOB_CATEGORIES = [
  "Backend",
  "Frontend", 
  "Database",
  "QA",
  "Fullstack",
  "DevOps",
  "Mobile",
  "DataScience",
  "rawresumes",
  "rejected-resumes",
  "outputjson",
  "extracted"
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

// API Types
export interface UploadedFile {
  original_filename: string;
  unique_filename: string;
  minio_path: string;
  bucket_name: string;
  file_size_bytes: number;
  file_size_mb: number;
  upload_timestamp: string;
  status: string;
}

export interface RejectedFile {
  original_filename: string;
  reason: string;
  error_details?: string;
}

export interface BucketInfo {
  bucket_name: string;
  status: string;
  message: string;
}

export interface UploadSummary {
  total_files_submitted: number;
  total_files_processed: number;
  successful_uploads: number;
  rejected_files: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  status_message: string;
  bucket_info: BucketInfo;
  summary: UploadSummary;
  uploaded_files: UploadedFile[];
  rejected_files: RejectedFile[];
  job_category: string | null;
  description: string | null;
  timestamp: string;
}

export interface SearchResult {
  id: string;
  name: string;
  email_id: string;
  phone_number: string;
  linkedin_url: string | null;
  github_url: string | null;
  location: string;
  current_job_title: string;
  objective: string;
  skills: string[];
  qualifications_summary: string;
  experience_summary: string;
  companies_worked_with_duration: string[];
  certifications: string[];
  awards_achievements: string[];
  projects: string[];
  languages: string[];
  availability_status: string | null;
  work_authorization_status: string | null;
  has_photo: boolean;
  _original_filename: string;
  personal_details: any;
  personal_info: any;
  _is_master_record: boolean;
  _duplicate_group_id: string;
  _duplicate_count: number;
  _associated_original_filenames: string[];
  _associated_ids: string[];
  similarity_score?: number; // This might be added by the search API
}

export interface SearchResponse {
  success: boolean;
  query: string;
  total_results: number;
  results: SearchResult[];
}

// Utility function to extract first name and last name from full name
export function extractFirstLastName(fullName: string): { firstName: string; lastName: string } {
  const words = fullName.trim().split(' ').filter(word => word.length > 0);
  
  if (words.length === 0) {
    return { firstName: 'Unknown', lastName: 'Candidate' };
  } else if (words.length === 1) {
    return { firstName: words[0], lastName: '' };
  } else {
    return { 
      firstName: words[0], 
      lastName: words.slice(1).join(' ') 
    };
  }
}

// Utility function to get initials from name
export function getInitials(fullName: string): string {
  const { firstName, lastName } = extractFirstLastName(fullName);
  return firstName.charAt(0) + (lastName.charAt(0) || firstName.charAt(1) || '');
}

// Utility function to format skills array for display
export function formatSkills(skills: string[], maxDisplay: number = 5): { displayed: string[], remaining: number } {
  const displayed = skills.slice(0, maxDisplay);
  const remaining = Math.max(0, skills.length - maxDisplay);
  return { displayed, remaining };
}

// Utility function to get latest company from companies array
export function getLatestCompany(companies: string[] | undefined): string {
  if (!companies || companies.length === 0) return 'Not specified';
  // Assuming the first company in the array is the latest
  return companies[0];
}

// Utility function to truncate text
export function truncateText(text: string | null | undefined, maxLength: number): string {
  if (!text) return 'Not specified';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Utility function to format file size
export function formatFileSize(sizeInMB: number): string {
  if (sizeInMB < 1) {
    return `${Math.round(sizeInMB * 1024)} KB`;
  }
  return `${sizeInMB.toFixed(2)} MB`;
}

// Utility function to format upload timestamp
export function formatUploadTimestamp(timestamp: string): string {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch (error) {
    return timestamp;
  }
}

// Utility function to extract clean name from filename
export function extractCleanName(filename: string): string {
  let name = filename.replace(/\.[^/.]+$/, ""); // Remove extension
  name = name.replace(/resume/gi, ""); // Remove "resume" word
  name = name.replace(/[_\-]+/g, " "); // Replace underscores and hyphens with spaces
  name = name.replace(/^\d{8}_\d{6}_\d{3}_/, ""); // Remove timestamp prefix if present
  name = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
  return name || "Unknown";
}