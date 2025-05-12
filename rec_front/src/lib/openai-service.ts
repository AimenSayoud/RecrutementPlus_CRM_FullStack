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
// Configure whether to use backend or direct OpenAI
const USE_BACKEND_AI = process.env.NEXT_PUBLIC_USE_BACKEND_AI === 'true';
// Don't use mock data by default - always prefer real OpenAI API
const USE_MOCK_DATA = process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
// API base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

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

// Interface for backend responses
interface BackendResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Generate chat completion using OpenAI API or backend service
 */
export async function generateChatCompletion(messages: OpenAIMessage[]): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    console.log("Using mock data for OpenAI service");
    return generateMockResponse(messages);
  }

  try {
    // Decide whether to use backend or direct OpenAI
    if (USE_BACKEND_AI) {
      // Call backend service
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-tools/chat-completion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate response from backend');
      }

      const data = await response.json();
      return data.content;
    } else {
      // Call OpenAI API directly
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',  // Using a compact model for cost efficiency
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
    }
  } catch (error) {
    console.error('Error generating chat completion:', error);

    // Return a fallback response in case of an error
    return "I'm sorry, I'm having trouble connecting to my AI service at the moment. Please try again later.";
  }
}

/**
 * Generate a mock response for testing without API calls
 */
function generateMockResponse(messages: OpenAIMessage[]): string {
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

/**
 * Function to generate email template for a candidate using backend or direct OpenAI
 */
export async function generateCandidateEmail(
  candidate: Candidate, 
  purpose: string, 
  additionalContext?: string
): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      {
        role: 'user',
        content: `Generate an email to ${candidate.firstName} ${candidate.lastName} about ${purpose}`
      }
    ]);
  }

  try {
    if (USE_BACKEND_AI) {
      // Use backend service for email generation
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-tools/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: 'cv_acknowledgment', // Default template
          context: {
            candidate_name: `${candidate.firstName} ${candidate.lastName}`,
            candidate_id: candidate.id,
            email: candidate.email,
            job_title: candidate.position,
            status: candidate.status,
            additional_context: additionalContext || '',
            purpose: purpose
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate email from backend');
      }

      const data = await response.json();
      return data.body;
    } else {
      // Use direct OpenAI integration
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
  } catch (error) {
    console.error('Error generating candidate email:', error);
    return "Dear Candidate,\n\nThank you for your interest in our company. We appreciate you taking the time to apply.\n\nWe will review your application and get back to you soon.\n\nBest regards,";
  }
}

/**
 * Function to generate email template for a company using backend or direct OpenAI
 */
export async function generateCompanyEmail(
  company: Company,
  purpose: string,
  additionalContext?: string
): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      {
        role: 'user',
        content: `Generate an email to ${company.contactPerson} at ${company.name} about ${purpose}`
      }
    ]);
  }

  try {
    if (USE_BACKEND_AI) {
      // Use backend service for email generation
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-tools/generate-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          template_id: 'company_introduction', // Default template for companies
          context: {
            company_name: company.name,
            contact_person: company.contactPerson,
            contact_email: company.contactEmail,
            industry: company.industry,
            open_positions: company.openPositions,
            additional_context: additionalContext || '',
            purpose: purpose
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate email from backend');
      }

      const data = await response.json();
      return data.body;
    } else {
      // Use direct OpenAI integration
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
  } catch (error) {
    console.error('Error generating company email:', error);
    return "Dear Hiring Manager,\n\nI hope this email finds you well. I'm reaching out from our recruitment agency to discuss potential collaboration.\n\nWe specialize in finding top talent for companies in your industry and would love to discuss how we can help with your hiring needs.\n\nBest regards,";
  }
}

/**
 * Generate interview questions based on job description using backend or direct OpenAI
 */
export async function generateInterviewQuestions(job: Job): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      {
        role: 'user',
        content: `Generate interview questions for a ${job.title} position`
      }
    ]);
  }

  try {
    if (USE_BACKEND_AI) {
      // Use backend service for interview questions
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-tools/generate-interview-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: {
            title: job.title,
            company_name: job.companyName,
            description: job.description,
            requirements: job.requirements,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate interview questions from backend');
      }

      const data = await response.json();
      // Format questions in a readable way
      return formatInterviewQuestions(data);
    } else {
      // Use direct OpenAI integration
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
  } catch (error) {
    console.error('Error generating interview questions:', error);
    return "1. Can you tell me about your experience in this field?\n2. How do you handle challenging situations at work?\n3. What are your strengths and weaknesses?\n4. Why are you interested in this position?\n5. Where do you see yourself in 5 years?";
  }
}

/**
 * Format interview questions from backend into readable text
 */
function formatInterviewQuestions(questions: any[]): string {
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

/**
 * Generate interview questions for a specific position
 */
export async function generatePositionInterviewQuestions(
  position: string,
  companyName?: string,
  additionalContext?: string
): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      {
        role: 'user',
        content: `Generate interview questions for a ${position} position${companyName ? ` at ${companyName}` : ''}`
      }
    ]);
  }

  try {
    if (USE_BACKEND_AI) {
      // Use backend service for interview questions
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-tools/generate-interview-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          job_description: {
            title: position,
            company_name: companyName || 'the company',
            description: additionalContext || `A ${position} position`,
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate interview questions from backend');
      }

      const data = await response.json();
      // Format questions in a readable way
      return formatInterviewQuestions(data);
    } else {
      // Use direct OpenAI integration
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
  } catch (error) {
    console.error('Error generating position interview questions:', error);
    return "1. Can you tell me about your experience in this field?\n2. How do you handle challenging situations at work?\n3. What are your strengths and weaknesses?\n4. Why are you interested in this position?\n5. Where do you see yourself in 5 years?";
  }
}

/**
 * Generate job description
 */
export async function generateJobDescription(
  position: string,
  companyName: string,
  industry?: string,
  additionalContext?: string
): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      {
        role: 'user',
        content: `Generate a job description for a ${position} position at ${companyName}`
      }
    ]);
  }

  try {
    if (USE_BACKEND_AI) {
      // Use backend service for job description
      const response = await fetch(`${API_BASE_URL}/api/v1/ai-tools/generate-job-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position,
          company_name: companyName,
          industry: industry || null,
          required_skills: additionalContext ? additionalContext.split(',').map(skill => skill.trim()) : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate job description from backend');
      }

      const data = await response.json();
      // Return the full text version for display
      return data.full_text || formatJobDescription(data);
    } else {
      // Use direct OpenAI integration
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
  } catch (error) {
    console.error('Error generating job description:', error);
    return `# ${position} at ${companyName}\n\n## About the Company\n\n## Job Description\n\n## Requirements\n\n## Benefits`;
  }
}

/**
 * Format job description from structured data into readable text
 */
function formatJobDescription(data: any): string {
  let description = `# ${data.title}\n\n`;
  
  description += `## About ${data.company_overview ? 'Us' : 'the Company'}\n\n`;
  description += `${data.company_overview || 'We are a leading company in our industry.'}\n\n`;
  
  description += `## Role Overview\n\n`;
  description += `${data.role_summary || `We are seeking a talented ${data.title} to join our team.`}\n\n`;
  
  description += `## Key Responsibilities\n\n`;
  if (data.key_responsibilities && data.key_responsibilities.length > 0) {
    data.key_responsibilities.forEach((resp: string) => {
      description += `- ${resp}\n`;
    });
  } else {
    description += `- Responsibilities to be determined\n`;
  }
  description += '\n';
  
  description += `## Required Qualifications\n\n`;
  if (data.required_qualifications && data.required_qualifications.length > 0) {
    data.required_qualifications.forEach((qual: string) => {
      description += `- ${qual}\n`;
    });
  } else {
    description += `- Qualifications to be determined\n`;
  }
  description += '\n';
  
  if (data.preferred_qualifications && data.preferred_qualifications.length > 0) {
    description += `## Preferred Qualifications\n\n`;
    data.preferred_qualifications.forEach((qual: string) => {
      description += `- ${qual}\n`;
    });
    description += '\n';
  }
  
  if (data.required_skills && data.required_skills.length > 0) {
    description += `## Required Skills\n\n`;
    data.required_skills.forEach((skill: string) => {
      description += `- ${skill}\n`;
    });
    description += '\n';
  }
  
  if (data.benefits && data.benefits.length > 0) {
    description += `## Benefits & Perks\n\n`;
    data.benefits.forEach((benefit: string) => {
      description += `- ${benefit}\n`;
    });
    description += '\n';
  }
  
  if (data.application_process) {
    description += `## How to Apply\n\n`;
    description += `${data.application_process}\n\n`;
  }
  
  return description;
}

/**
 * Generate candidate feedback
 */
export async function generateCandidateFeedback(
  candidate: Candidate,
  interviewNotes?: string
): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      {
        role: 'user',
        content: `Generate feedback for ${candidate.firstName} ${candidate.lastName}`
      }
    ]);
  }

  try {
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
  } catch (error) {
    console.error('Failed to generate candidate feedback:', error);
    return `Feedback for ${candidate.firstName} ${candidate.lastName}:\n\nThank you for your interest in the position. We appreciate the time you took to speak with us about the role.`;
  }
}

/**
 * Process general queries
 */
export async function processGeneralQuery(query: string, context?: string): Promise<string> {
  // Use mock data if flag is set
  if (USE_MOCK_DATA) {
    return generateMockResponse([
      {
        role: 'user',
        content: query
      }
    ]);
  }

  try {
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
  } catch (error) {
    console.error('Error processing query:', error);
    return "I'm sorry, I couldn't process your query at this time. Please try again later.";
  }
}