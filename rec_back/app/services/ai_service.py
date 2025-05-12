import re
import json
import os
import logging
from typing import Dict, List, Tuple, Any, Optional, Union
from pathlib import Path
import openai
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AIService:
    """Enhanced service for AI-powered recruitment functionalities"""
    
    def __init__(self):
        # Initialize OpenAI API with key from environment variables
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            self.client = OpenAI(api_key=self.openai_api_key)
            logger.info("OpenAI client initialized successfully")
        else:
            logger.warning("OPENAI_API_KEY not found in environment variables")
            self.client = None
        
        # Load necessary data
        self._load_data()
        
        # Define system prompts for different tasks
        self.system_prompts = {
            "cv_analysis": """You are an expert recruitment assistant specialized in analyzing CVs and extracting structured information.
Focus on accurately identifying skills, education history, work experience, and creating a professional summary.
Always format your response as a well-structured JSON object.""",
            
            "job_matching": """You are an expert AI recruitment matching system.
Your task is to evaluate how well a candidate's profile matches job requirements.
Consider skills alignment, experience relevance, and overall suitability.
Provide a match score and explain your reasoning in detail.
Format your response as a JSON object.""",
            
            "email_generation": """You are an expert recruitment consultant who writes clear, professional, and personalized emails.
Create emails that are warm yet professional, concise yet informative, and tailored to the recipient.
Maintain appropriate formality and ensure all details are accurate."""
        }
    
    def _load_data(self):
        """Load necessary data files for AI operations"""
        try:
            # Load jobs data
            jobs_path = Path("fake_data/jobs.json")
            with open(jobs_path, "r") as f:
                self.jobs = json.load(f)
            logger.info(f"Loaded {len(self.jobs)} jobs from jobs.json")
            
            # Load email templates
            templates_path = Path("fake_data/email_templates.json")
            with open(templates_path, "r") as f:
                templates = json.load(f)
                self.email_templates = {template["id"]: template for template in templates}
            logger.info(f"Loaded {len(self.email_templates)} email templates")
            
            # Load candidate data
            candidates_path = Path("fake_data/candidate_profiles.json")
            if candidates_path.exists():
                with open(candidates_path, "r") as f:
                    self.candidates = json.load(f)
                logger.info(f"Loaded {len(self.candidates)} candidate profiles")
            else:
                self.candidates = []
                logger.warning("No candidate profiles found")
            
            # Load user data
            users_path = Path("fake_data/users.json")
            if users_path.exists():
                with open(users_path, "r") as f:
                    self.users = json.load(f)
                logger.info(f"Loaded {len(self.users)} users")
            else:
                self.users = []
                logger.warning("No users found")
            
            # Load employer data
            employers_path = Path("fake_data/employer_profiles.json")
            if employers_path.exists():
                with open(employers_path, "r") as f:
                    self.employers = json.load(f)
                logger.info(f"Loaded {len(self.employers)} employer profiles")
            else:
                self.employers = []
                logger.warning("No employer profiles found")
                
            # Load skills data
            skills_path = Path("fake_data/skills.json")
            if skills_path.exists():
                with open(skills_path, "r") as f:
                    self.skills = json.load(f)
                # Create skill lookup for faster access
                self.skill_lookup = {skill["id"]: skill["name"] for skill in self.skills}
                logger.info(f"Loaded {len(self.skills)} skills")
            else:
                self.skills = []
                self.skill_lookup = {}
                logger.warning("No skills found")
                
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            # Initialize empty data to avoid None references
            self.jobs = []
            self.email_templates = {}
            self.candidates = []
            self.users = []
            self.employers = []
            self.skills = []
            self.skill_lookup = {}
    
    def analyze_cv_with_openai(self, cv_text: str) -> Dict[str, Any]:
        """
        Enhanced CV analysis using OpenAI's API to extract key information
        
        Args:
            cv_text: The CV content as plain text
            
        Returns:
            Dict containing structured CV information including skills, education, experience,
            total years of experience, and a professional summary
        """
        if not self.client:
            # Fallback to rule-based analysis if API key is not available
            logger.warning("OpenAI client not available, using rule-based CV analysis")
            return self.analyze_cv(cv_text)
        
        try:
            # Create a detailed prompt with clear structure expectations
            prompt = f"""
            Please analyze the following CV/resume and extract this information in a structured JSON format:

            1. SKILLS: Extract a comprehensive list of all technical and soft skills mentioned
            2. EDUCATION: Extract all education entries with degree, institution, field of study, and years (start and end dates if available)
            3. EXPERIENCE: Extract all work experiences with job title, company, time period, and key responsibilities/achievements
            4. TOTAL_EXPERIENCE_YEARS: Calculate the total professional experience in years based on work history
            5. SUMMARY: Create a professional summary (3-4 sentences) highlighting key qualifications and expertise

            Format the response as a JSON object with these keys:
            {{
                "skills": ["skill1", "skill2", ...],
                "education": [
                    {{
                        "degree": "...",
                        "institution": "...", 
                        "field": "...",
                        "start_year": "...",
                        "end_year": "..."
                    }},
                    ...
                ],
                "experience": [
                    {{
                        "title": "...",
                        "company": "...",
                        "duration": "...", 
                        "start_date": "...",
                        "end_date": "...",
                        "current": true/false,
                        "responsibilities": ["...", "...", ...]
                    }},
                    ...
                ],
                "total_experience_years": X,
                "summary": "..."
            }}
            
            CV TEXT:
            {cv_text}
            """
            
            # Call OpenAI API with JSON mode for structured output
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",  # Using the latest compact model for cost efficiency
                messages=[
                    {"role": "system", "content": self.system_prompts["cv_analysis"]},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,  # Lower temperature for more consistent output
                response_format={"type": "json_object"}  # Request JSON format
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Log analysis success
            logger.info(f"Successfully analyzed CV with OpenAI, extracted {len(result.get('skills', []))} skills")
            
            # Ensure all expected keys are present
            expected_keys = ["skills", "education", "experience", "total_experience_years", "summary"]
            for key in expected_keys:
                if key not in result:
                    if key in ["skills", "education", "experience"]:
                        result[key] = []
                    elif key == "total_experience_years":
                        result[key] = 0
                    else:
                        result[key] = ""
            
            # Add skill IDs where possible by matching with our skills database
            result["skill_ids"] = self._map_skills_to_ids(result["skills"])
            
            return result
            
        except Exception as e:
            logger.error(f"Error using OpenAI API for CV analysis: {str(e)}")
            # Fallback to rule-based analysis
            return self.analyze_cv(cv_text)
    
    def _map_skills_to_ids(self, skill_names: List[str]) -> List[int]:
        """Map skill names to skill IDs from our database"""
        skill_ids = []
        
        # Create a normalized version of our skill lookup for better matching
        normalized_skills = {name.lower(): id for id, name in self.skill_lookup.items()}
        
        for skill in skill_names:
            skill_lower = skill.lower()
            # Try direct match
            if skill_lower in normalized_skills:
                skill_ids.append(normalized_skills[skill_lower])
                continue
                
            # Try partial match
            for db_skill, skill_id in normalized_skills.items():
                if skill_lower in db_skill or db_skill in skill_lower:
                    skill_ids.append(skill_id)
                    break
        
        return skill_ids
    
    def match_jobs_with_openai(self, cv_analysis: Dict[str, Any], job_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Enhanced job matching using OpenAI for intelligent semantic matching
        
        Args:
            cv_analysis: Dictionary with CV analysis results
            job_id: Optional specific job ID to match against
            
        Returns:
            List of job matches with match scores and explanations
        """
        if not self.client:
            # Fallback to rule-based matching if API key is not available
            logger.warning("OpenAI client not available, using rule-based job matching")
            return self.match_jobs(cv_analysis.get("skills", []))
        
        try:
            # Filter jobs if job_id is provided
            jobs_to_match = [job for job in self.jobs if job["id"] == job_id] if job_id else self.jobs
            
            if not jobs_to_match:
                logger.warning(f"No jobs found to match against (job_id={job_id})")
                return []
            
            # Limit to 5 jobs for API efficiency if matching against all jobs
            if len(jobs_to_match) > 5 and job_id is None:
                # Sort by recency and take most recent 5
                jobs_to_match = sorted(jobs_to_match, key=lambda j: j.get("posting_date", ""), reverse=True)[:5]
                logger.info(f"Limited job matching to 5 most recent jobs for API efficiency")
                
            # Create job descriptions for matching
            job_descriptions = []
            for job in jobs_to_match:
                # Get company name for context
                employer = next((e for e in self.employers if e.get("id") == job.get("employer_id")), {})
                company_name = employer.get("company_name", f"Company {job.get('employer_id')}")
                
                # Map skill IDs to names
                skill_names = [self.skill_lookup.get(skill_id, f"Skill-{skill_id}") for skill_id in job.get("skills", [])]
                
                description = {
                    "job_id": job["id"],
                    "title": job["title"],
                    "company": company_name,
                    "description": job["description"],
                    "requirements": job.get("requirements", []),
                    "skills": skill_names,
                    "location": job.get("location", "Not specified"),
                    "contract_type": job.get("contract_type", "Not specified"),
                    "remote_option": job.get("remote_option", False)
                }
                job_descriptions.append(description)
            
            # Convert candidate info to a structured format
            candidate_info = {
                "skills": cv_analysis.get("skills", []),
                "experience": cv_analysis.get("experience", []),
                "education": cv_analysis.get("education", []),
                "total_experience_years": cv_analysis.get("total_experience_years", 0),
                "summary": cv_analysis.get("summary", "")
            }
            
            # Create a prompt for OpenAI
            prompt = f"""
            I need to match a candidate profile with job positions.

            CANDIDATE PROFILE:
            {json.dumps(candidate_info, indent=2)}

            JOB POSITIONS:
            {json.dumps(job_descriptions, indent=2)}

            For each job position, please:
            1. Calculate a match score (0-100) based on skills alignment, experience relevance, and education fit
            2. Identify which skills from the candidate match with the job requirements
            3. Provide a brief explanation (2-3 sentences) of the match quality
            4. Suggest one specific area where the candidate could improve to better match the position

            Return the results as a JSON array of objects, one for each job, sorted by match score (highest first):
            [
                {
                    "job_id": number,
                    "job_title": string,
                    "company_name": string,
                    "match_score": number (0-100),
                    "matching_skills": [list of strings],
                    "non_matching_skills": [list of important skills the candidate is missing],
                    "match_explanation": string,
                    "improvement_suggestion": string
                }
            ]
            """
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.system_prompts["job_matching"]},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Ensure we have a list of matches
            matches = result.get("matches", [])
            if not isinstance(matches, list) and "matches" in result:
                matches = result["matches"]
            elif not isinstance(matches, list) and isinstance(result, list):
                matches = result
            elif not isinstance(matches, list):
                matches = []
                
            # Sort by match score
            matches.sort(key=lambda x: x.get("match_score", 0), reverse=True)
            
            # Log match results
            logger.info(f"Successfully matched candidate against {len(matches)} jobs")
            
            return matches
            
        except Exception as e:
            logger.error(f"Error using OpenAI API for job matching: {str(e)}")
            # Fallback to rule-based matching
            return self.match_jobs(cv_analysis.get("skills", []))
    
    def generate_email_with_openai(self, template_id: str, context: Dict[str, Any]) -> Dict[str, str]:
        """
        Generate a personalized email using OpenAI with enhanced context awareness
        
        Args:
            template_id: The ID of the email template to use
            context: Dictionary with context for email personalization
            
        Returns:
            Dictionary with subject and body of the generated email
        """
        if not self.client:
            # Fallback to template-based email if API key is not available
            logger.warning("OpenAI client not available, using template-based email generation")
            return self.generate_email(template_id, context)
        
        try:
            # Get the base template
            if template_id not in self.email_templates:
                error_msg = f"Template with ID {template_id} not found"
                logger.error(error_msg)
                raise ValueError(error_msg)
            
            template = self.email_templates[template_id]
            base_subject = template["subject"]
            base_template = template["template"]
            
            # Do basic placeholder replacement to give OpenAI context
            for key, value in context.items():
                placeholder = "{{" + key + "}}"
                base_subject = base_subject.replace(placeholder, str(value))
                if isinstance(value, list) and key == "matching_skills":
                    formatted_skills = ", ".join(value)
                    base_template = base_template.replace(placeholder, formatted_skills)
                else:
                    base_template = base_template.replace(placeholder, str(value))
            
            # Get recipient type and enhance context
            recipient_type = "candidate" if "candidate_name" in context else "company"
            enhanced_context = {}
            
            if recipient_type == "candidate":
                enhanced_context = {
                    "candidate_name": context.get("candidate_name", "Candidate"),
                    "job_title": context.get("job_title", "the position"),
                    "company_name": context.get("company_name", "our client"),
                    "skills": context.get("skills", []),
                    "matching_skills": context.get("matching_skills", []),
                    "candidate_status": "new candidate" if "new" in template_id else "interviewed candidate" if "interview" in template_id else "candidate",
                    "communication_purpose": template_id.replace("_", " ")
                }
            else:
                enhanced_context = {
                    "company_name": context.get("company_name", "the company"),
                    "contact_person": context.get("contact_person", "Hiring Manager"),
                    "job_title": context.get("job_title", "open position"),
                    "industry": context.get("industry", "your industry"),
                    "communication_purpose": template_id.replace("_", " ")
                }
            
            # Create a prompt for OpenAI with detailed enhancement instructions
            prompt = f"""
            I need to generate a personalized, professional email for a recruitment process.
            
            Template type: {template_id} ({template_id.replace("_", " ")})
            Recipient type: {recipient_type}
            
            Original subject: {base_subject}
            
            Original template content: 
            {base_template}
            
            Context information:
            {json.dumps(enhanced_context, indent=2)}
            
            Please enhance this email to make it:
            1. More personalized to the recipient's specific situation
            2. Professional but warm in tone
            3. Clear and concise (no more than 250 words)
            4. Well-structured with proper paragraphs
            5. Include a clear call to action or next steps
            
            Return a JSON object with:
            - "subject": An improved subject line that's attention-grabbing
            - "body": The complete email text (excluding opening/greeting and signature)
            - "greeting": A personalized greeting line
            - "call_to_action": A clear next step for the recipient
            """
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.system_prompts["email_generation"]},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,  # Higher temperature for more creative output
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Format email with standard greeting and signature
            greeting = result.get("greeting", f"Dear {context.get('candidate_name', context.get('contact_person', 'Sir/Madam'))},")
            call_to_action = result.get("call_to_action", "")
            
            # If there's a specific call to action, make sure it's included in the body
            body = result.get("body", base_template)
            if call_to_action and call_to_action not in body:
                body = f"{body}\n\n{call_to_action}"
                
            # Add signature line - would be customized in a real system
            signature = "\n\nBest regards,\n[Recruiter Name]\nRecruitment Consultant\nRecrutementPlus"
            
            formatted_email = f"{greeting}\n\n{body}{signature}"
            
            return {
                "subject": result.get("subject", base_subject),
                "body": formatted_email
            }
            
        except Exception as e:
            logger.error(f"Error using OpenAI API for email generation: {str(e)}")
            # Fallback to template-based email
            return self.generate_email(template_id, context)
    
    def generate_interview_questions(self, job_description: Dict[str, Any], candidate_info: Optional[Dict[str, Any]] = None) -> List[Dict[str, str]]:
        """
        Generate personalized interview questions based on job description and optional candidate info
        
        Args:
            job_description: Dictionary with job details
            candidate_info: Optional dictionary with candidate information
            
        Returns:
            List of question objects with question text and purpose
        """
        if not self.client:
            # Return basic interview questions if API key is not available
            logger.warning("OpenAI client not available, using basic interview questions")
            return self._generate_basic_interview_questions(job_description.get("title", ""))
        
        try:
            # Create a role-specific system prompt
            system_prompt = """You are an expert recruitment interview specialist.
Generate insightful, job-specific interview questions that assess both technical skills and cultural fit.
Create a mix of behavioral, situational, technical, and experience-based questions.
Each question should have a clear purpose that helps evaluate the candidate effectively."""
            
            # Build context from job description
            job_context = {
                "title": job_description.get("title", ""),
                "company": job_description.get("company_name", "the company"),
                "description": job_description.get("description", ""),
                "requirements": job_description.get("requirements", []),
                "skills": job_description.get("skills", []),
            }
            
            # Add candidate context if available
            candidate_context = {}
            if candidate_info:
                candidate_context = {
                    "name": candidate_info.get("name", ""),
                    "skills": candidate_info.get("skills", []),
                    "experience": candidate_info.get("experience", []),
                    "experience_years": candidate_info.get("total_experience_years", 0),
                }
            
            # Determine if we need to tailor questions to the candidate
            has_candidate = bool(candidate_info)
            
            # Create a prompt for OpenAI
            prompt = f"""
            Generate 7-10 high-quality interview questions for a {job_context['title']} position at {job_context['company']}.
            
            JOB DETAILS:
            {json.dumps(job_context, indent=2)}
            
            {"CANDIDATE DETAILS:" if has_candidate else ""}
            {json.dumps(candidate_context, indent=2) if has_candidate else ""}
            
            Please create questions that:
            1. Assess technical skills and competencies required for the position
            2. Evaluate cultural fit and soft skills
            3. Probe for relevant experience and achievements
            4. {"Are tailored to this specific candidate's background" if has_candidate else "Would be appropriate for candidates with varying experience levels"}
            5. Include a mix of behavioral, situational, and technical questions
            
            For each question, include:
            - The question text
            - The purpose (what this question aims to assess)
            - A note on what to look for in the answer
            
            Format your response as a JSON array of question objects:
            [
                {{
                    "question": "Question text here",
                    "purpose": "What this question aims to assess",
                    "evaluation_guidance": "What to look for in the candidate's answer"
                }}
            ]
            """
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.5,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Extract questions from the response
            questions = result.get("questions", [])
            if not isinstance(questions, list) and isinstance(result, list):
                questions = result
            elif not isinstance(questions, list):
                questions = []
                
            # Log successful generation
            logger.info(f"Generated {len(questions)} interview questions for {job_context['title']} position")
            
            return questions
            
        except Exception as e:
            logger.error(f"Error generating interview questions: {str(e)}")
            # Fallback to basic questions
            return self._generate_basic_interview_questions(job_description.get("title", ""))
    
    def _generate_basic_interview_questions(self, position: str) -> List[Dict[str, str]]:
        """Generate basic interview questions as a fallback"""
        return [
            {
                "question": f"Can you tell me about your experience in {position} roles?",
                "purpose": "Assessing relevant experience"
            },
            {
                "question": "Describe a challenging project you worked on and how you approached it.",
                "purpose": "Evaluating problem-solving skills"
            },
            {
                "question": "How do you stay updated with the latest developments in your field?",
                "purpose": "Assessing continuous learning"
            },
            {
                "question": "What are your strengths and weaknesses as they relate to this role?",
                "purpose": "Self-awareness and honesty"
            },
            {
                "question": "Describe a situation where you had to work under pressure or tight deadlines.",
                "purpose": "Stress management and prioritization"
            }
        ]
    
    def generate_job_description(self, 
                               position: str, 
                               company_name: str, 
                               industry: Optional[str] = None, 
                               required_skills: Optional[List[str]] = None) -> Dict[str, str]:
        """
        Generate a comprehensive job description for a position
        
        Args:
            position: Job title/position
            company_name: Name of the company
            industry: Optional industry
            required_skills: Optional list of required skills
            
        Returns:
            Dictionary with structured job description sections
        """
        if not self.client:
            # Return basic job description if API key is not available
            logger.warning("OpenAI client not available, using basic job description template")
            return self._generate_basic_job_description(position, company_name, industry)
        
        try:
            # Create a prompt for OpenAI
            system_prompt = """You are an expert recruitment content writer specializing in job descriptions.
Create compelling, detailed, and well-structured job descriptions that attract qualified candidates.
Focus on clear responsibilities, specific requirements, and compelling company information.
The tone should be professional but engaging, avoiding discriminatory language or unrealistic expectations."""
            
            # Build context
            skills_text = ", ".join(required_skills) if required_skills else "to be determined based on the position"
            
            prompt = f"""
            Generate a comprehensive and attractive job description for a {position} position at {company_name}{f" in the {industry} industry" if industry else ""}.
            
            The job description should include these sections:
            1. Company Overview: Brief introduction to {company_name}{f" and its position in the {industry} industry" if industry else ""}
            2. Role Summary: Concise overview of the {position} position
            3. Key Responsibilities: 5-7 specific duties and responsibilities
            4. Required Qualifications: 4-6 must-have qualifications including education, experience, and skills
            5. Preferred Qualifications: 2-4 nice-to-have qualifications
            6. Required Skills: Technical and soft skills needed ({skills_text})
            7. Benefits & Perks: What the company offers to employees
            8. Application Process: How to apply for the position
            
            Guidelines:
            - Keep the total length between 400-600 words
            - Use clear, concise language without jargon
            - Avoid discriminatory language or unrealistic requirements
            - Focus on what the candidate will do, not just what they need to have
            - Include salary range if appropriate
            - Highlight growth opportunities and company culture
            
            Format the response as a JSON object with these sections:
            {{
                "title": "Job title",
                "company_overview": "Text...",
                "role_summary": "Text...",
                "key_responsibilities": ["Item 1", "Item 2", ...],
                "required_qualifications": ["Item 1", "Item 2", ...],
                "preferred_qualifications": ["Item 1", "Item 2", ...],
                "required_skills": ["Skill 1", "Skill 2", ...],
                "benefits": ["Benefit 1", "Benefit 2", ...],
                "application_process": "Text...",
                "full_text": "The complete job description as continuous text with proper formatting"
            }}
            """
            
            # Call OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.6,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Log successful generation
            logger.info(f"Generated job description for {position} at {company_name}")
            
            # Ensure all expected sections are present
            expected_keys = ["title", "company_overview", "role_summary", "key_responsibilities", 
                            "required_qualifications", "preferred_qualifications", "required_skills",
                            "benefits", "application_process", "full_text"]
            
            for key in expected_keys:
                if key not in result:
                    if key in ["key_responsibilities", "required_qualifications", 
                              "preferred_qualifications", "required_skills", "benefits"]:
                        result[key] = []
                    else:
                        result[key] = ""
            
            return result
            
        except Exception as e:
            logger.error(f"Error generating job description: {str(e)}")
            # Fallback to basic job description
            return self._generate_basic_job_description(position, company_name, industry)
    
    def _generate_basic_job_description(self, position: str, company_name: str, industry: Optional[str] = None) -> Dict[str, str]:
        """Generate a basic job description as a fallback"""
        industry_text = f" in the {industry} industry" if industry else ""
        overview = f"{company_name} is a leading company{industry_text} looking for talented professionals to join our team."
        
        description = {
            "title": position,
            "company_overview": overview,
            "role_summary": f"We are seeking a talented {position} to join our growing team.",
            "key_responsibilities": [
                f"Perform {position} duties as assigned",
                "Collaborate with team members on projects",
                "Report to management on progress and results",
                "Maintain high standards of quality in all work"
            ],
            "required_qualifications": [
                f"Previous experience in {position} role",
                "Relevant education or certification",
                "Strong communication skills",
                "Ability to work in a team environment"
            ],
            "preferred_qualifications": [
                "Advanced degree in related field",
                "Additional certifications"
            ],
            "required_skills": [
                "Communication",
                "Teamwork",
                "Time management",
                "Problem-solving"
            ],
            "benefits": [
                "Competitive salary",
                "Professional development opportunities",
                "Health insurance",
                "Flexible working hours"
            ],
            "application_process": "Please submit your resume and cover letter to apply for this position.",
            "full_text": f"{overview}\n\nRole Summary:\nWe are seeking a talented {position} to join our growing team.\n\n[Basic job description content would continue here]"
        }
        
        return description
    
    # Legacy methods preserved for fallback functionality
    
    def analyze_cv(self, cv_text: str) -> Dict[str, Any]:
        """
        Analyze CV content and extract key information using rule-based approach
        """
        # Extract skills
        skills = self._extract_skills(cv_text)
        
        # Extract education
        education = self._extract_education(cv_text)
        
        # Extract experience
        experience, total_years = self._extract_experience(cv_text)
        
        # Generate a summary
        summary = self._generate_summary(skills, education, experience)
        
        return {
            "skills": skills,
            "education": education,
            "experience": experience,
            "total_experience_years": total_years,
            "summary": summary
        }
    
    def match_jobs(self, skills: List[str], experience_years: int = 0) -> List[Dict[str, Any]]:
        """Match extracted CV data against available jobs using rule-based approach"""
        matches = []
        
        for job in self.jobs:
            # Get job skills (in a real app, you'd have better matching logic)
            job_skills = []
            for skill_id in job.get("skills", []):
                # In a real app, you'd query this from the database
                # Here we're just creating mock skill names based on IDs
                skill_name = self.skill_lookup.get(skill_id, f"Skill-{skill_id}")
                job_skills.append(skill_name)
            
            # Calculate match score (simple intersection of skills)
            matching_skills = [skill for skill in skills if any(
                skill.lower() in js.lower() or js.lower() in skill.lower() 
                for js in job_skills
            )]
            
            match_score = len(matching_skills) / max(len(job_skills), 1) * 100
            
            if match_score > 30:  # Arbitrary threshold
                matches.append({
                    "job_id": job["id"],
                    "job_title": job["title"],
                    "employer_id": job["employer_id"],
                    "match_score": match_score,
                    "matching_skills": matching_skills
                })
        
        # Sort by match score descending
        matches.sort(key=lambda x: x["match_score"], reverse=True)
        return matches
    
    def generate_email(self, template_id: str, context: Dict[str, Any]) -> Dict[str, str]:
        """Generate an email based on template and context"""
        if template_id not in self.email_templates:
            raise ValueError(f"Template with ID {template_id} not found")
        
        template = self.email_templates[template_id]
        subject = template["subject"]
        body = template["template"]
        
        # Replace placeholders in subject
        for key, value in context.items():
            placeholder = "{{" + key + "}}"
            subject = subject.replace(placeholder, str(value))
        
        # Replace placeholders in body
        for key, value in context.items():
            placeholder = "{{" + key + "}}"
            if isinstance(value, list) and key == "matching_skills":
                formatted_skills = "\n".join([f"- {skill}" for skill in value])
                body = body.replace(placeholder, formatted_skills)
            else:
                body = body.replace(placeholder, str(value))
                
        return {
            "subject": subject,
            "body": body
        }
    
    # Helper methods for rule-based analysis
    
    def _extract_skills(self, cv_text: str) -> List[str]:
        """Extract skills from CV text using pattern matching"""
        # Look for a skills section
        skills_pattern = re.compile(r'SKILLS\n(.*?)(?:\n\n|\Z)', re.DOTALL | re.IGNORECASE)
        skills_match = skills_pattern.search(cv_text)
        
        if skills_match:
            skills_text = skills_match.group(1)
            skills = [skill.strip() for skill in re.split(r',|\n', skills_text) if skill.strip()]
            return skills
        
        # Fallback: extract common skills
        common_skills = [
            "Python", "JavaScript", "Java", "C#", "React", "Angular", 
            "Node.js", "SQL", "AWS", "Docker", "Kubernetes", "Digital Marketing",
            "SEO", "Content Strategy", "Social Media"
        ]
        
        found_skills = []
        for skill in common_skills:
            if re.search(r'\b' + re.escape(skill) + r'\b', cv_text, re.IGNORECASE):
                found_skills.append(skill)
                
        return found_skills
    
    def _extract_education(self, cv_text: str) -> List[Dict[str, str]]:
        """Extract education information"""
        education_pattern = re.compile(r'EDUCATION\n(.*?)(?:\n\n|\Z)', re.DOTALL | re.IGNORECASE)
        education_match = education_pattern.search(cv_text)
        
        if not education_match:
            return []
            
        education_text = education_match.group(1)
        education_entries = education_text.strip().split('\n')
        
        education = []
        for entry in education_entries:
            parts = entry.split('|')
            if len(parts) >= 2:
                degree = parts[0].strip()
                institution = parts[1].strip()
                years = parts[2].strip() if len(parts) > 2 else ""
                
                education.append({
                    "degree": degree,
                    "institution": institution,
                    "years": years
                })
                
        return education
    
    def _extract_experience(self, cv_text: str) -> Tuple[List[Dict[str, str]], int]:
        """Extract work experience information and total years"""
        experience_pattern = re.compile(r'WORK EXPERIENCE\n(.*?)(?:EDUCATION|\Z)', re.DOTALL | re.IGNORECASE)
        experience_match = experience_pattern.search(cv_text)
        
        if not experience_match:
            return [], 0
            
        experience_text = experience_match.group(1)
        experience_entries = re.split(r'\n(?=\w+\s+\|)', experience_text.strip())
        
        experience = []
        total_years = 0
        
        for entry in experience_entries:
            parts = entry.split('|')
            if len(parts) >= 3:
                title = parts[0].strip()
                company = parts[1].strip()
                duration = parts[2].strip()
                
                # Extract years (crude approximation for demo purposes)
                years_pattern = re.compile(r'(\d{4})\s*-\s*(Present|\d{4})')
                years_match = years_pattern.search(duration)
                
                if years_match:
                    start_year = int(years_match.group(1))
                    end_year = 2024 if years_match.group(2) == "Present" else int(years_match.group(2))
                    years_duration = end_year - start_year
                    total_years += years_duration
                
                experience.append({
                    "title": title,
                    "company": company,
                    "duration": duration
                })
                
        return experience, total_years
    
    def _generate_summary(self, skills: List[str], education: List[Dict[str, str]], 
                         experience: List[Dict[str, str]]) -> str:
        """Generate a summary of the candidate's profile"""
        # This would be a sophisticated NLG task in a real system
        # Here we'll just create a simple template-based summary
        
        exp_years = len(experience)
        skill_text = ", ".join(skills[:5])
        if len(skills) > 5:
            skill_text += f", and {len(skills) - 5} more"
            
        education_level = "Master's" if any("Master" in edu.get("degree", "") for edu in education) else "Bachelor's"
        
        summary = f"Candidate with approximately {exp_years} years of experience, "
        summary += f"skilled in {skill_text}. "
        summary += f"Has a {education_level} level education"
        
        if experience:
            latest_role = experience[0]["title"]
            latest_company = experience[0]["company"]
            summary += f" and most recently worked as a {latest_role} at {latest_company}."
        else:
            summary += "."
            
        return summary