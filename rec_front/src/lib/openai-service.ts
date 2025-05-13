// src/lib/openai-service.ts
import axios from 'axios'; // Using axios directly for simplicity. Adapt to your apiService if preferred.
import { Candidate, Company, Job } from '@/types';
import {
  CvAnalysisRequest, CvAnalysisResponse,
  JobMatchRequest, JobMatch, // Renamed JobMatchResponseItem to JobMatch for frontend
  EmailGenerationRequest, EmailGenerationResponse, EmailGenerationContext,
  InterviewQuestionsRequest, InterviewQuestionItem,
  JobDescriptionRequest, JobDescriptionResponse,
  OpenAIMessage, // Keep this if used for direct OpenAI calls or for the backend chat wrapper
  ChatCompletionRequest, ChatCompletionResponse
} from '@/types'; // Assuming AI types are moved/added to src/types/index.ts

// Get the OpenAI API key from environment variables - This might become obsolete if backend handles the key
const getOpenAIKey = (): string | undefined => {
  if (typeof window !== 'undefined') {
    const sessionKey = window.sessionStorage.getItem('OPENAI_API_KEY');
    if (sessionKey) return sessionKey;
  }
  return process.env.NEXT_PUBLIC_OPENAI_API_KEY;
};

const OPENAI_API_KEY = getOpenAIKey(); // May not be needed if all calls go through your backend
const OPENAI_DIRECT_API_URL = 'https://api.openai.com/v1/chat/completions'; // For direct calls if USE_BACKEND_AI is false

const USE_BACKEND_AI = process.env.NEXT_PUBLIC_USE_BACKEND_AI === 'true';
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'false';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
const AI_TOOLS_BASE_PATH = '/api/v1/ai-tools';


// Helper function to make API calls to your backend
async function backendApiCall<TRequest, TResponse>(endpoint: string, payload: TRequest): Promise<TResponse> {
  try {
    const response = await axios.post<TResponse>(`${API_BASE_URL}${AI_TOOLS_BASE_PATH}${endpoint}`, payload);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error as any) && (error as any).response) {
      console.error(`Error calling backend AI service ${endpoint}:`, (error as any).response.data);
      throw new Error((error as any).response.data.detail || `Backend AI service error for ${endpoint}`);
    } else {
      console.error(`Network or other error for ${endpoint}:`, error);
      throw new Error(`Failed to connect to AI service for ${endpoint}`);
    }
  }
}


// Store OpenAI API key in session storage for development (if still needed for direct OpenAI calls)
export const setOpenAIKey = (apiKey: string) => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('OPENAI_API_KEY', apiKey);
    // Consider if reload is always desired or if state should update to reflect key change
    window.location.reload();
  }
};


/**
 * Generate chat completion using OpenAI API (direct or via backend)
 * This function might need to be split or refactored.
 * If USE_BACKEND_AI is true, it should call your backend's /chat-completion endpoint.
 */
export async function generateChatCompletion(messages: OpenAIMessage[]): Promise<string> {
  if (USE_MOCK_DATA) {
    console.log("Using mock data for chat completion");
    return generateMockResponse(messages); // Existing mock logic
  }

  if (USE_BACKEND_AI) {
    const payload: ChatCompletionRequest = { messages };
    try {
      const response = await backendApiCall<ChatCompletionRequest, ChatCompletionResponse>('/chat-completion', payload);
      return response.content;
    } catch (error) {
      console.error('Error generating chat completion from backend:', error);
      return "I'm sorry, I'm having trouble connecting to the backend AI service.";
    }
  } else {
    // Direct OpenAI call (existing logic)
    if (!OPENAI_API_KEY) {
      return "OpenAI API key is not configured. Please set it in the settings.";
    }
    try {
      const response = await fetch(OPENAI_DIRECT_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate response from OpenAI');
      }
      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      console.error('Error generating chat completion from OpenAI:', error);
      return "I'm sorry, I'm having trouble connecting to the OpenAI service.";
    }
  }
}


// --- New functions calling your backend AI services ---

export async function analyzeCv(cvText: string): Promise<CvAnalysisResponse> {
  if (USE_MOCK_DATA) {
    return {
      skills: ["Mock Skill: Python", "Mock Skill: FastAPI"],
      education: [{ institution: "Mock University", degree: "MS CS" }],
      experience: [{ title: "Mock Developer", company: "Mock Inc.", duration: "2 years" }],
      total_experience_years: 2,
      summary: "This is a mock CV analysis summary."
    };
  }
  const payload: CvAnalysisRequest = { cv_text: cvText };
  return backendApiCall<CvAnalysisRequest, CvAnalysisResponse>('/analyze-cv', payload);
}

export async function matchJobs(cvAnalysis: CvAnalysisResponse, jobId?: number): Promise<JobMatch[]> {
    if (USE_MOCK_DATA) {
        return [{
            job_id: 1, job_title: "Mock Job", company_name: "Mock Company", match_score: 85,
            matching_skills: ["Python"], non_matching_skills: ["Java"],
            match_explanation: "Good match based on Python.", improvement_suggestion: "Learn Java."
        }];
    }
  const payload: JobMatchRequest = { cv_analysis: cvAnalysis, job_id: jobId };
  return backendApiCall<JobMatchRequest, JobMatch[]>('/match-jobs', payload);
}

// --- Updated functions to call your backend ---

export async function generateCandidateEmail(
  candidate: Candidate,
  purpose: string,
  additionalContext?: string // You might want to structure this better or include in 'purpose'
): Promise<string> {
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      { role: 'user', content: `Generate an email to ${candidate.firstName} about ${purpose}` }
    ]);
  }

  if (USE_BACKEND_AI) {
    const context: EmailGenerationContext = {
      candidate_id: candidate.id,
      candidate_name: `${candidate.firstName} ${candidate.lastName}`,
      email: candidate.email,
      job_title: candidate.position,
      status: candidate.status,
      // You might want a more structured way to pass additionalContext if it's complex
      // For now, let's assume it's part of the 'purpose' or a simple string field.
      additional_context: additionalContext || '',
      purpose: purpose, // The AI service will use this to pick/generate template
      // consultant_name: 'Your Name' // Or get from logged-in user
    };
    // The backend's /generate-email expects template_id and context.
    // We need to decide how 'purpose' maps to a 'template_id' or if the backend handles this.
    // For now, let's assume a generic template_id or that the backend infers it from purpose.
    const payload: EmailGenerationRequest = {
      template_id: `candidate_${purpose.toLowerCase().replace(/\s+/g, '_')}`, // e.g., candidate_interview_invitation
      context,
    };
    try {
      const response = await backendApiCall<EmailGenerationRequest, EmailGenerationResponse>('/generate-email', payload);
      return response.body; // Backend now returns subject and body.
    } catch (error) {
      console.error('Error generating candidate email from backend:', error);
      return "Error generating email. Please try again.";
    }
  } else {
    // Fallback to direct OpenAI call (original logic)
    // This part needs OPENAI_API_KEY and direct OpenAI call setup
     if (!OPENAI_API_KEY) return "OpenAI API Key not configured for direct email generation.";
    const fullName = `${candidate.firstName} ${candidate.lastName}`;
    const messages: OpenAIMessage[] = [
      { role: 'system', content: `You are an AI assistant helping a recruitment agency. Generate professional email templates for candidates. Be friendly, professional, and concise. DO NOT include any signature/footer or "Best regards" section at the end - the application will add this automatically.` },
      { role: 'user', content: `Generate an email to ${fullName} (${candidate.email}) about ${purpose}. Current status: ${candidate.status}. Position applying for: ${candidate.position}. Additional context: ${additionalContext || 'N/A'}` }
    ];
    return generateChatCompletion(messages); // This generateChatCompletion also needs to respect USE_BACKEND_AI
  }
}

export async function generateCompanyEmail(
  company: Company,
  purpose: string,
  additionalContext?: string
): Promise<string> {
  if (USE_MOCK_DATA) {
    return generateMockResponse([{ role: 'user', content: `Generate an email to ${company.name} about ${purpose}` }]);
  }

  if (USE_BACKEND_AI) {
    const context: EmailGenerationContext = {
      company_name: company.name,
      contact_person: company.contactPerson,
      contact_email: company.contactEmail,
      industry: company.industry,
      open_positions: company.openPositions,
      additional_context: additionalContext || '',
      purpose: purpose,
    };
    const payload: EmailGenerationRequest = {
      template_id: `company_${purpose.toLowerCase().replace(/\s+/g, '_')}`, // e.g., company_introduction
      context,
    };
     try {
      const response = await backendApiCall<EmailGenerationRequest, EmailGenerationResponse>('/generate-email', payload);
      return response.body;
    } catch (error) {
      console.error('Error generating company email from backend:', error);
      return "Error generating email. Please try again.";
    }
  } else {
    if (!OPENAI_API_KEY) return "OpenAI API Key not configured for direct email generation.";
    const messages: OpenAIMessage[] = [
      { role: 'system', content: `You are an AI assistant helping a recruitment agency. Generate professional email templates for companies. Be formal, professional, and concise. DO NOT include any signature/footer or "Best regards" section at the end - the application will add this automatically.` },
      { role: 'user', content: `Generate an email to ${company.contactPerson} at ${company.name} (${company.contactEmail}) about ${purpose}. Industry: ${company.industry}. Open Positions: ${company.openPositions}. Additional context: ${additionalContext || 'N/A'}` }
    ];
    return generateChatCompletion(messages);
  }
}

export async function generateJobInterviewQuestions(job: Job): Promise<string> { // Renamed to avoid conflict
  if (USE_MOCK_DATA) {
    return generateMockResponse([{ role: 'user', content: `Generate interview questions for ${job.title}` }]);
  }

  if (USE_BACKEND_AI) {
    const payload: InterviewQuestionsRequest = {
      job_description: {
        title: job.title,
        company_name: job.companyName,
        description: job.description,
        requirements: job.requirements,
        // skills: job.skills (if available on Job type)
      }
      // candidate_info can be omitted or passed if available
    };
    try {
      const questionsArray = await backendApiCall<InterviewQuestionsRequest, InterviewQuestionItem[]>('/generate-interview-questions', payload);
      return formatInterviewQuestions(questionsArray); // Use existing formatter
    } catch (error) {
      console.error('Error generating interview questions from backend:', error);
      return "Error generating interview questions.";
    }
  } else {
     if (!OPENAI_API_KEY) return "OpenAI API Key not configured for direct question generation.";
    const messages: OpenAIMessage[] = [
        { role: 'system', content: `You are an AI assistant helping a recruitment agency. Generate relevant interview questions based on job descriptions. Focus on both technical skills and soft skills.`},
        { role: 'user', content: `Generate 5-7 interview questions for a ${job.title} position at ${job.companyName}. Job description: ${job.description}. Requirements: ${job.requirements.join(', ')}. Location: ${job.location}${job.salaryRange ? `. Salary Range: ${job.salaryRange}` : ''}`}
    ];
    return generateChatCompletion(messages);
  }
}

export async function generatePositionInterviewQuestions(
  position: string,
  companyName?: string,
  additionalContext?: string
): Promise<string> {
  if (USE_MOCK_DATA) {
    return generateMockResponse([{ role: 'user', content: `Generate interview questions for ${position}` }]);
  }

  if (USE_BACKEND_AI) {
     const payload: InterviewQuestionsRequest = {
      job_description: {
        title: position,
        company_name: companyName || 'the company',
        description: additionalContext || `A ${position} position`,
      }
    };
    try {
      const questionsArray = await backendApiCall<InterviewQuestionsRequest, InterviewQuestionItem[]>('/generate-interview-questions', payload);
      return formatInterviewQuestions(questionsArray);
    } catch (error) {
      console.error('Error generating position interview questions from backend:', error);
      return "Error generating interview questions.";
    }
  } else {
     if (!OPENAI_API_KEY) return "OpenAI API Key not configured for direct question generation.";
    const messages: OpenAIMessage[] = [
        { role: 'system', content: `You are an AI assistant helping a recruitment agency. Generate relevant interview questions for specific positions. Focus on both technical skills and soft skills.`},
        { role: 'user', content: `Generate 5-7 interview questions for a ${position} position${companyName ? ` at ${companyName}` : ''}.${additionalContext ? ` Additional context: ${additionalContext}` : ''}`}
    ];
    return generateChatCompletion(messages);
  }
}

export async function generateJobDescriptionService( // Renamed to avoid conflict
  position: string,
  companyName: string,
  industry?: string,
  requiredSkills?: string[] // Changed from additionalContext to match backend
): Promise<string> {
  if (USE_MOCK_DATA) {
    return generateMockResponse([{ role: 'user', content: `Generate job description for ${position} at ${companyName}` }]);
  }

  if (USE_BACKEND_AI) {
    const payload: JobDescriptionRequest = {
      position,
      company_name: companyName,
      industry: industry || undefined,
      required_skills: requiredSkills || undefined
    };
    try {
      const response = await backendApiCall<JobDescriptionRequest, JobDescriptionResponse>('/generate-job-description', payload);
      return response.full_text; // Backend returns a structured object with full_text
    } catch (error) {
      console.error('Error generating job description from backend:', error);
      return "Error generating job description.";
    }
  } else {
     if (!OPENAI_API_KEY) return "OpenAI API Key not configured for direct JD generation.";
    const additionalContext = requiredSkills ? `Required skills: ${requiredSkills.join(', ')}` : '';
    const messages: OpenAIMessage[] = [
        { role: 'system', content: `You are an AI assistant helping a recruitment agency. Generate comprehensive and attractive job descriptions that will appeal to qualified candidates.`},
        { role: 'user', content: `Generate a job description for a ${position} position at ${companyName}${industry ? ` in the ${industry} industry` : ''}. Include sections for: Company overview, Role responsibilities, Required qualifications, Preferred qualifications, Benefits and perks. ${additionalContext ? `Additional context: ${additionalContext}` : ''}`}
    ];
    return generateChatCompletion(messages);
  }
}


// Candidate Feedback and General Query largely remain calls to generateChatCompletion
// but they too can be routed via backend if you create specific endpoints for them.
// For now, let's assume they might still use direct OpenAI or a generic backend chat endpoint.

export async function generateCandidateFeedback(
  candidate: Candidate,
  interviewNotes?: string
): Promise<string> {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  if (USE_MOCK_DATA) {
    return `Mock feedback for ${fullName}. Notes: ${interviewNotes || 'N/A'}`;
  }
  // If using backend, this would ideally be a specific endpoint.
  // For now, it uses the generic chat completion, which needs context.
  const messages: OpenAIMessage[] = [
    { role: 'system', content: `You are an AI assistant helping a recruitment agency. Generate objective and constructive feedback for candidates after interviews.` },
    { role: 'user', content: `Generate feedback for ${fullName} who applied for a ${candidate.position} position. Current status: ${candidate.status}. ${interviewNotes ? `Interview notes: ${interviewNotes}` : 'No specific interview notes provided.'}` }
  ];
  return generateChatCompletion(messages); // This will use USE_BACKEND_AI logic within generateChatCompletion
}

export async function processGeneralQuery(query: string, context?: string): Promise<string> {
  if (USE_MOCK_DATA) {
    return `Mock response for query: ${query}. Context: ${context || 'N/A'}`;
  }
   // Uses the generic chat completion.
  const messages: OpenAIMessage[] = [
    { role: 'system', content: `You are an AI assistant helping a recruitment agency. Provide helpful, concise, and professional responses to queries about recruitment, job searching, and career development.` },
    { role: 'user', content: `${query}${context ? `\nContext: ${context}` : ''}` }
  ];
  return generateChatCompletion(messages); // This will use USE_BACKEND_AI logic within generateChatCompletion
}


// --- Utility functions (keep as is or adapt) ---
function generateMockResponse(messages: OpenAIMessage[]): string {
  const lastUserMessage = messages.findLast(msg => msg.role === 'user')?.content || '';
  if (lastUserMessage.toLowerCase().includes('email')) {
    return "Dear [Name],\n\nThis is a mock email response.\n\nBest regards.";
  }
  // Add more mock responses as needed
  return "This is a generic mock response from the AI assistant.";
}

function formatInterviewQuestions(questions: InterviewQuestionItem[]): string {
  if (!questions || !Array.isArray(questions)) {
    return "Could not format interview questions: Invalid data.";
  }
  let formattedText = "# Interview Questions\n\n";
  questions.forEach((q, index) => {
    formattedText += `## Question ${index + 1}: ${q.question}\n\n`;
    if (q.purpose) {
      formattedText += `**Purpose:** ${q.purpose}\n\n`;
    }
    if (q.evaluation_guidance) {
      formattedText += `**What to look for:** ${q.evaluation_guidance}\n\n`;
    }
  });
  return formattedText;
}

// Removed: formatJobDescription (backend now sends full_text)