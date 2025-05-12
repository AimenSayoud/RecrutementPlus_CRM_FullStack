// src/lib/openai-service.ts
import { Candidate, Company, Job } from '@/types';

// Get the OpenAI API key from environment variables
// Add your key to .env.local as NEXT_PUBLIC_OPENAI_API_KEY=your-key-here
const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const API_URL = 'https://api.openai.com/v1/chat/completions';

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateChatCompletion(messages: OpenAIMessage[]): Promise<string> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini-2025-04-14',  // Using gpt-4.1-mini-2025-04-14 model
        messages,
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to generate response');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating chat completion:', error);
    
    // Return a fallback response in case of an error
    return "I'm sorry, I'm having trouble connecting to my AI service at the moment. Please try again later.";
  }
}

// Function to generate email template for a candidate
export async function generateCandidateEmail(
  candidate: Candidate, 
  purpose: string, 
  additionalContext?: string
): Promise<string> {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping a recruitment agency. Generate professional email templates for candidates. Be friendly, professional, and concise.`
    },
    {
      role: 'user',
      content: `Generate an email to ${fullName} (${candidate.email}) about ${purpose}. 
        Current status: ${candidate.status}
        Position applying for: ${candidate.position}
        Additional context: ${additionalContext || 'N/A'}`
    }
  ];

  return generateChatCompletion(messages);
}

// Function to generate email template for a company
export async function generateCompanyEmail(
  company: Company,
  purpose: string,
  additionalContext?: string
): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping a recruitment agency. Generate professional email templates for companies. Be formal, professional, and concise.`
    },
    {
      role: 'user',
      content: `Generate an email to ${company.contactPerson} at ${company.name} (${company.contactEmail}) about ${purpose}.
        Industry: ${company.industry}
        Open Positions: ${company.openPositions}
        Additional context: ${additionalContext || 'N/A'}`
    }
  ];

  return generateChatCompletion(messages);
}

// Generate interview questions based on job description
export async function generateInterviewQuestions(job: Job): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping a recruitment agency. Generate relevant interview questions based on job descriptions. Focus on both technical skills and soft skills.`
    },
    {
      role: 'user',
      content: `Generate 5-7 interview questions for a ${job.title} position at ${job.companyName}.
        Job description: ${job.description}
        Requirements: ${job.requirements.join(', ')}
        Location: ${job.location}
        ${job.salaryRange ? `Salary Range: ${job.salaryRange}` : ''}`
    }
  ];

  return generateChatCompletion(messages);
}

// Generate interview questions for a specific position
export async function generatePositionInterviewQuestions(
  position: string,
  companyName?: string,
  additionalContext?: string
): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping a recruitment agency. Generate relevant interview questions for specific positions. Focus on both technical skills and soft skills.`
    },
    {
      role: 'user',
      content: `Generate 5-7 interview questions for a ${position} position${companyName ? ` at ${companyName}` : ''}.
        ${additionalContext ? `Additional context: ${additionalContext}` : ''}`
    }
  ];

  return generateChatCompletion(messages);
}

// Generate job description
export async function generateJobDescription(
  position: string,
  companyName: string,
  industry?: string,
  additionalContext?: string
): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping a recruitment agency. Generate comprehensive and attractive job descriptions that will appeal to qualified candidates.`
    },
    {
      role: 'user',
      content: `Generate a job description for a ${position} position at ${companyName}${industry ? ` in the ${industry} industry` : ''}.
        Include sections for:
        - Company overview
        - Role responsibilities
        - Required qualifications
        - Preferred qualifications
        - Benefits and perks
        ${additionalContext ? `Additional context: ${additionalContext}` : ''}`
    }
  ];

  return generateChatCompletion(messages);
}

// Generate candidate feedback
export async function generateCandidateFeedback(
  candidate: Candidate,
  interviewNotes?: string
): Promise<string> {
  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping a recruitment agency. Generate objective and constructive feedback for candidates after interviews.`
    },
    {
      role: 'user',
      content: `Generate feedback for ${fullName} who applied for a ${candidate.position} position.
        Current status: ${candidate.status}
        ${interviewNotes ? `Interview notes: ${interviewNotes}` : 'No specific interview notes provided.'}`
    }
  ];

  return generateChatCompletion(messages);
}

// Process general queries
export async function processGeneralQuery(query: string, context?: string): Promise<string> {
  const messages: OpenAIMessage[] = [
    {
      role: 'system',
      content: `You are an AI assistant helping a recruitment agency. Provide helpful, concise, and professional responses to queries about recruitment, job searching, and career development.`
    },
    {
      role: 'user',
      content: `${query}${context ? `\nContext: ${context}` : ''}`
    }
  ];

  return generateChatCompletion(messages);
}