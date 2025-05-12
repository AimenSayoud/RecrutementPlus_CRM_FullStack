import re
import json
import os
from typing import Dict, List, Tuple, Any, Optional
from pathlib import Path
import openai
from dotenv import load_dotenv

# Comment out database imports
# from app.db.unit_of_work import UnitOfWork
# from app.models.user import User
# from app.models.candidate import CandidateProfile
# from app.models.job import Job
# from app.models.employer import EmployerProfile

# Load environment variables from .env file
load_dotenv()

class AIService:
    """Service for AI-powered functionalities like CV analysis and email generation"""
    
    def __init__(self):
        # Initialize OpenAI API with key from environment variables
        self.openai_api_key = os.getenv("OPENAI_API_KEY")
        if self.openai_api_key:
            openai.api_key = self.openai_api_key
        else:
            print("Warning: OPENAI_API_KEY not found in environment variables")
        
        # Load fake job data for matching
        jobs_path = Path("fake_data/jobs.json")
        with open(jobs_path, "r") as f:
            self.jobs = json.load(f)
            
        # Load email templates
        templates_path = Path("fake_data/email_templates.json")
        with open(templates_path, "r") as f:
            templates = json.load(f)
            self.email_templates = {template["id"]: template for template in templates}
            
        # Load candidate data
        candidates_path = Path("fake_data/candidate_profiles.json")
        if candidates_path.exists():
            with open(candidates_path, "r") as f:
                self.candidates = json.load(f)
        else:
            self.candidates = []
            
        # Load user data
        users_path = Path("fake_data/users.json")
        if users_path.exists():
            with open(users_path, "r") as f:
                self.users = json.load(f)
        else:
            self.users = []
            
        # Load employer data
        employers_path = Path("fake_data/employer_profiles.json")
        if employers_path.exists():
            with open(employers_path, "r") as f:
                self.employers = json.load(f)
        else:
            self.employers = []
    
    # Replace database methods with JSON file methods
    def get_candidate_data(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get candidate data from JSON files"""
        # Find user
        user = next((u for u in self.users if u.get("id") == user_id), None)
        if not user or user.get("role") != "candidate":
            return None
            
        # Find candidate profile
        candidate = next((c for c in self.candidates if c.get("user_id") == user_id), None)
        if not candidate:
            return None
            
        return {
            "user": user,
            "profile": candidate
        }
    
    def get_job_data(self, job_id: int) -> Optional[Dict[str, Any]]:
        """Get job data from JSON files"""
        # Find job
        job = next((j for j in self.jobs if j.get("id") == job_id), None)
        if not job:
            return None
            
        # Find employer
        employer_id = job.get("employer_id")
        employer = next((e for e in self.employers if e.get("id") == employer_id), None)
        
        return {
            "job": job,
            "employer": employer
        }
    
    def analyze_cv_with_openai(self, cv_text: str) -> Dict[str, Any]:
        """
        Analyze CV content using OpenAI's API to extract key information
        """
        if not self.openai_api_key:
            # Fallback to rule-based analysis if API key is not available
            return self.analyze_cv(cv_text)
        
        try:
            # Create a prompt for OpenAI
            prompt = f"""
            Analyze the following CV/resume and extract this information in JSON format:
            1. A list of skills
            2. Education history (degree, institution, years)
            3. Work experience (title, company, duration)
            4. Total years of experience
            5. A professional summary of the candidate (3-4 sentences)
            
            Format the response as a JSON object with keys: skills (array), education (array of objects), 
            experience (array of objects), experienceYears (number), and summary (string).
            
            CV TEXT:
            {cv_text}
            """
            
            # Call OpenAI API
            response = openai.chat.completions.create(
                model="gpt-4.1-mini-2025-04-14",  # Use the appropriate model
                messages=[
                    {"role": "system", "content": "You are an expert recruitment assistant that analyzes CVs and extracts structured information."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,  # Lower temperature for more consistent output
                response_format={"type": "json_object"}  # Request JSON format
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Ensure the result has all the keys we expect
            expected_keys = ["skills", "education", "experience", "experienceYears", "summary"]
            for key in expected_keys:
                if key not in result:
                    result[key] = [] if key in ["skills", "education", "experience"] else ""
            
            # Format the result in our expected structure
            return {
                "skills": result["skills"],
                "education": result["education"],
                "experience": result["experience"],
                "total_experience_years": result.get("experienceYears", 0),
                "summary": result["summary"]
            }
            
        except Exception as e:
            print(f"Error using OpenAI API: {str(e)}")
            # Fallback to rule-based analysis
            return self.analyze_cv(cv_text)
    
    def match_jobs_with_openai(self, cv_analysis: Dict[str, Any], job_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """
        Match CV against jobs using OpenAI for intelligent matching
        If job_id is provided, only match against that job
        """
        if not self.openai_api_key:
            # Fallback to rule-based matching if API key is not available
            return self.match_jobs(cv_analysis["skills"])
        
        try:
            # Filter jobs if job_id is provided
            jobs_to_match = [job for job in self.jobs if job["id"] == job_id] if job_id else self.jobs
            
            if not jobs_to_match:
                return []
                
            # Create job descriptions for matching
            job_descriptions = []
            for job in jobs_to_match:
                description = f"Job ID: {job['id']}\nTitle: {job['title']}\nDescription: {job['description']}\n"
                description += f"Requirements: {', '.join(job['requirements'])}\n"
                description += f"Skills: {', '.join([f'Skill-{skill_id}' for skill_id in job.get('skills', [])])}\n"
                job_descriptions.append(description)
            
            all_jobs = "\n---\n".join(job_descriptions)
            
            # Prepare candidate info
            candidate_info = f"""
            Skills: {', '.join(cv_analysis['skills'])}
            Education: {json.dumps(cv_analysis['education'])}
            Experience: {json.dumps(cv_analysis['experience'])}
            Experience Years: {cv_analysis.get('total_experience_years', 0)}
            Summary: {cv_analysis['summary']}
            """
            
            # Create a prompt for OpenAI
            prompt = f"""
            I have a candidate with the following profile:
            
            {candidate_info}
            
            And I have the following job position(s):
            
            {all_jobs}
            
            For each job, calculate a match score (0-100) based on how well the candidate matches the job requirements.
            Consider skills, experience, and qualifications. For each match, provide the matching skills that align with the job.
            
            Return matches in JSON format like this:
            [
                {{
                    "job_id": number,
                    "job_title": string,
                    "employer_id": number,
                    "match_score": number,
                    "matching_skills": [list of strings],
                    "match_explanation": string
                }}
            ]
            """
            
            # Call OpenAI API
            response = openai.chat.completions.create(
                model="gpt-4.1-mini-2025-04-14",
                messages=[
                    {"role": "system", "content": "You are an expert recruitment matching system that evaluates candidate-job fit."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            # Ensure we have a list
            if not isinstance(result, list) and "matches" in result:
                matches = result["matches"]
            elif not isinstance(result, list):
                matches = []
            else:
                matches = result
                
            # Sort by match score
            matches.sort(key=lambda x: x.get("match_score", 0), reverse=True)
            
            return matches
            
        except Exception as e:
            print(f"Error using OpenAI API for job matching: {str(e)}")
            # Fallback to rule-based matching
            return self.match_jobs(cv_analysis["skills"])
    
    def generate_email_with_openai(self, template_id: str, context: Dict[str, Any]) -> Dict[str, str]:
        """Generate a personalized email using OpenAI"""
        if not self.openai_api_key:
            # Fallback to template-based email if API key is not available
            return self.generate_email(template_id, context)
        
        try:
            # Get the base template
            if template_id not in self.email_templates:
                raise ValueError(f"Template with ID {template_id} not found")
            
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
            
            # Create a prompt for OpenAI
            prompt = f"""
            I need to generate a personalized, professional email for a recruitment process. 
            
            Template type: {template_id}
            Base subject: {base_subject}
            Base template: 
            {base_template}
            
            Candidate name: {context.get('candidate_name', 'Candidate')}
            Job title: {context.get('job_title', 'the position')}
            Company: {context.get('company_name', 'our client')}
            CV analysis: {context.get('cv_analysis', '')}
            Matching skills: {', '.join(context.get('matching_skills', []))}
            
            Please enhance this email to make it:
            1. More personalized based on the candidate's skills and experience
            2. Professional but warm in tone
            3. Clear about next steps
            4. Well-structured with proper paragraphs
            
            Return a JSON object with "subject" and "body" fields, where "body" is the complete email text
            (including opening and closing).
            """
            
            # Call OpenAI API
            response = openai.chat.completions.create(
                model="gpt-4.1-mini-2025-04-14",
                messages=[
                    {"role": "system", "content": "You are an expert recruitment consultant who writes clear, professional, and personalized emails."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,  # Higher temperature for more creative output
                response_format={"type": "json_object"}
            )
            
            # Parse the response
            result = json.loads(response.choices[0].message.content)
            
            return {
                "subject": result.get("subject", base_subject),
                "body": result.get("body", base_template)
            }
            
        except Exception as e:
            print(f"Error using OpenAI API for email generation: {str(e)}")
            # Fallback to template-based email
            return self.generate_email(template_id, context)
    
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
                job_skills.append(f"Skill-{skill_id}")
            
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
    
    # Helper methods remain unchanged
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