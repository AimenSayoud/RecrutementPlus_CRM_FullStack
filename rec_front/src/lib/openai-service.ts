// src/lib/openai-service.ts
import { Candidate, Company, Job } from '@/types';

// Get the OpenAI API key from environment variables
// Add your key to .env.local as NEXT_PUBLIC_OPENAI_API_KEY=your-key-here
// You can also pass the API key through sessionStorage for development
const getOpenAIKey = () => {
  if (typeof window !== 'undefined') {
    // Try to get from sessionStorage first (for development)
    const sessionKey = window.sessionStorage.getItem('OPENAI_API_KEY');
    if (sessionKey) return sessionKey;
  }
  // Fall back to environment variable
  return process.env.NEXT_PUBLIC_OPENAI_API_KEY;
};

const OPENAI_API_KEY = getOpenAIKey();
const API_URL = 'https://api.openai.com/v1/chat/completions';
// Don't use mock data by default - always prefer real OpenAI API
const USE_MOCK_DATA = false;

// Store OpenAI API key in session storage for development
export const setOpenAIKey = (apiKey: string) => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.setItem('OPENAI_API_KEY', apiKey);
    window.location.reload(); // Reload to apply the key
  }
};

export interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function generateChatCompletion(messages: OpenAIMessage[]): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    console.log("Using mock data for OpenAI service");

    // Extract the last user message to generate a mock response
    const lastUserMessage = messages.findLast(msg => msg.role === 'user')?.content || '';

    // Generate mock responses based on content
    if (lastUserMessage.toLowerCase().includes('email')) {
      return "Dear [Name],\n\nI hope this email finds you well. I am reaching out on behalf of Recruitment Plus regarding [purpose].\n\n[Personalized content here based on the recipient's needs and background.]\n\nI would be happy to schedule a call to discuss this further at your convenience.\n\nThank you for your time and consideration.";
    } else if (lastUserMessage.toLowerCase().includes('interview question')) {
      return "Here are 5 interview questions:\n\n1. Can you describe a challenging project you worked on and how you approached it?\n\n2. How do you prioritize tasks when working on multiple projects with competing deadlines?\n\n3. Give an example of a time when you had to adapt to a significant change at work\n\n4. What strategies do you use to collaborate effectively with team members who have different working styles?\n\n5. Where do you see yourself professionally in 3-5 years and what steps are you taking to get there?";
    } else if (lastUserMessage.toLowerCase().includes('job description')) {
      return "# Position Title\n\n## About the Company\nWe are a dynamic organization committed to excellence in [industry]. Our mission is to [company mission].\n\n## Role Overview\nWe are seeking a talented and motivated professional to join our team as a [Position]. The successful candidate will be responsible for [key responsibilities].\n\n## Key Responsibilities\n- [Responsibility 1]\n- [Responsibility 2]\n- [Responsibility 3]\n\n## Requirements\n- [Requirement 1]\n- [Requirement 2]\n- [Requirement 3]\n\n## Qualifications\n- [Qualification 1]\n- [Qualification 2]\n\n## Benefits\n- Competitive salary\n- Professional development opportunities\n- [Other benefits]";
    } else if (lastUserMessage.toLowerCase().includes('suggestion')) {
      return "Here are some suggestions:\n\n1. Consider expanding your network through industry-specific events\n2. Regularly update your skills through relevant certifications\n3. Develop a personalized outreach strategy\n4. Create customized follow-up sequences for different candidate types\n5. Implement a structured feedback collection process";
    } else {
      return "I'm here to help with your recruitment needs. I can assist with creating email templates, generating interview questions, writing job descriptions, or providing suggestions for working with candidates and companies.";
    }
  }

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
      content: `You are an AI assistant helping a recruitment agency. Generate professional email templates for candidates. Be friendly, professional, and concise. DO NOT include any signature/footer or "Best regards" section at the end - the application will add this automatically.`
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
      content: `You are an AI assistant helping a recruitment agency. Generate professional email templates for companies. Be formal, professional, and concise. DO NOT include any signature/footer or "Best regards" section at the end - the application will add this automatically.`
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