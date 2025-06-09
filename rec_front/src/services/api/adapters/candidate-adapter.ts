// src/services/api/adapters/candidate-adapter.ts
import { Candidate } from '@/types';

/**
 * Adapter to convert backend candidate data to frontend Candidate type
 */
export function adaptCandidateFromApi(apiCandidate: any): Candidate {
  // Create a candidate object with required fields and fallbacks
  return {
    id: apiCandidate.id || '',
    firstName: apiCandidate.first_name || '',
    lastName: apiCandidate.last_name || '',
    email: apiCandidate.email || '',
    phone: apiCandidate.phone || '',
    position: (apiCandidate.profile && apiCandidate.profile.current_position) || '',
    status: 'new', // Default status
    createdAt: apiCandidate.created_at ? new Date(apiCandidate.created_at) : new Date(),
    updatedAt: apiCandidate.updated_at ? new Date(apiCandidate.updated_at) : new Date(),
    tags: [],
    officeId: '1' // Default officeId
  };
}

/**
 * Adapt a list of candidates from API format
 */
export function adaptCandidateListFromApi(apiResponse: any): { 
  candidates: Candidate[], 
  total: number,
  page: number,
  pageSize: number,
  totalPages: number
} {
  // Check if we have a valid response
  if (!apiResponse || !Array.isArray(apiResponse.candidates)) {
    console.error('Invalid candidate list response', apiResponse);
    return {
      candidates: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    };
  }

  // Map each candidate
  const candidates = apiResponse.candidates.map(adaptCandidateFromApi);

  return {
    candidates,
    total: apiResponse.total || 0,
    page: apiResponse.page || 1,
    pageSize: apiResponse.page_size || 20,
    totalPages: apiResponse.total_pages || 0
  };
}