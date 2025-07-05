// API Configuration
export const API_BASE_URL = "http://157.180.44.51:8000";

// API Endpoints
export const API_ENDPOINTS = {
  UPLOAD_PROFILE: `${API_BASE_URL}/upload_profile`,
  SEARCH_PROFILE: `${API_BASE_URL}/search_profile`,
  DOWNLOAD_RESUME: `${API_BASE_URL}/download_resume`,
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
  "DataScience"
] as const;

export type JobCategory = typeof JOB_CATEGORIES[number];

// API Types
export interface UploadResponse {
  status: string;
  files_uploaded?: number;
  result?: Array<{
    filename: string;
    status: string;
  }>;
}

export interface SearchResult {
  id: string;
  similarity_score: number;
  filename: string;
  job_category: string;
  minio_path: string;
  upload_timestamp: string;
  text_preview: string;
}

export interface SearchResponse {
  results: SearchResult[];
}

// Utility function to extract candidate name from filename
export function extractCandidateName(filename: string): string {
  // Remove file extension
  let name = filename.replace(/\.(pdf|doc|docx|txt)$/i, '');
  
  // Common patterns to remove
  const patternsToRemove = [
    /resume/gi,
    /cv/gi,
    /curriculum.?vitae/gi,
    /^(the.?)?/gi,
    /_+/g,
    /-+/g,
    /\s+/g
  ];
  
  // Remove common patterns
  patternsToRemove.forEach(pattern => {
    name = name.replace(pattern, ' ');
  });
  
  // Clean up extra spaces
  name = name.trim().replace(/\s+/g, ' ');
  
  // If name is empty or too short, return original filename
  if (!name || name.length < 2) {
    return filename.replace(/\.(pdf|doc|docx|txt)$/i, '');
  }
  
  // Split into words and capitalize each word
  const words = name.split(' ').filter(word => word.length > 0);
  
  // If we have words, format them properly
  if (words.length > 0) {
    return words
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
  
  return filename.replace(/\.(pdf|doc|docx|txt)$/i, '');
}

// Alternative: Extract first name and last name separately
export function extractFirstLastName(filename: string): { firstName: string; lastName: string } {
  const fullName = extractCandidateName(filename);
  const words = fullName.split(' ').filter(word => word.length > 0);
  
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