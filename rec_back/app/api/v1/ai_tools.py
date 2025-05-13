from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional, Dict, Any
import logging

# Import Pydantic models
from ai_tools_models import (
    CVAnalysisRequest, CVAnalysisResponse,
    JobMatchRequest, JobMatchResponseItem,
    EmailGenerationRequest, EmailGenerationResponse,
    InterviewQuestionsRequest, InterviewQuestionItem,
    JobDescriptionRequest, JobDescriptionResponse,
    EmailTemplateInfoResponseItem,
    ChatCompletionRequest, ChatCompletionResponse # If you add a chat endpoint
)

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize AI service
from app.services.ai_service import AIService
ai_service = AIService() # ai_service should already be initialized with data

@router.post("/analyze-cv", response_model=CVAnalysisResponse)
async def analyze_cv_endpoint(request_data: CVAnalysisRequest):
    """Analyze CV text and extract structured information"""
    try:
        analysis = ai_service.analyze_cv_with_openai(request_data.cv_text)
        logger.info(f"Successfully analyzed CV. Skills extracted: {len(analysis.get('skills', []))}")
        return analysis
    except Exception as e:
        logger.error(f"Error analyzing CV: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error analyzing CV: {str(e)}")

@router.post("/match-jobs", response_model=List[JobMatchResponseItem])
async def match_jobs_endpoint(request_data: JobMatchRequest):
    """Match CV against jobs with enhanced semantic matching"""
    try:
        matches = ai_service.match_jobs_with_openai(
            cv_analysis=request_data.cv_analysis.model_dump(), # Pass as dict
            job_id=request_data.job_id,
            max_jobs_to_match=request_data.max_jobs_to_match or 5
        )
        logger.info(f"Successfully matched CV against {len(matches)} jobs")
        return matches
    except Exception as e:
        logger.error(f"Error matching jobs: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error matching jobs: {str(e)}")

@router.post("/generate-email", response_model=EmailGenerationResponse)
async def generate_email_endpoint(request_data: EmailGenerationRequest):
    """Generate a personalized email based on template and context"""
    try:
        result = ai_service.generate_email_with_openai(request_data.template_id, request_data.context)
        logger.info(f"Successfully generated email using template {request_data.template_id}")
        return result
    except Exception as e:
        logger.error(f"Error generating email: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating email: {str(e)}")

@router.post("/generate-interview-questions", response_model=List[InterviewQuestionItem])
async def generate_interview_questions_endpoint(request_data: InterviewQuestionsRequest):
    """Generate interview questions based on job description and optional candidate info"""
    try:
        questions = ai_service.generate_interview_questions(
            job_details=request_data.job_description.model_dump(), # Pass as dict
            candidate_info=request_data.candidate_info.model_dump() if request_data.candidate_info else None # Pass as dict
        )
        logger.info(f"Successfully generated {len(questions)} interview questions")
        return questions
    except Exception as e:
        logger.error(f"Error generating interview questions: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating interview questions: {str(e)}")

@router.post("/generate-job-description", response_model=JobDescriptionResponse)
async def generate_job_description_endpoint(request_data: JobDescriptionRequest):
    """Generate a comprehensive job description"""
    try:
        job_description = ai_service.generate_job_description(
            position=request_data.position,
            company_name=request_data.company_name,
            industry=request_data.industry,
            required_skills=request_data.required_skills
        )
        logger.info(f"Successfully generated job description for {request_data.position} at {request_data.company_name}")
        return job_description
    except Exception as e:
        logger.error(f"Error generating job description: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error generating job description: {str(e)}")

@router.get("/email-templates", response_model=List[EmailTemplateInfoResponseItem])
async def get_email_templates_endpoint():
    """Get available email templates"""
    # This part was already mostly fine, just ensuring response_model usage
    templates_data = ai_service.email_templates # Assuming ai_service loads these
    if not templates_data: # If loaded as dict from AIService
        templates_list = list(ai_service.email_templates.values())
    else:
        templates_list = templates_data

    formatted_templates = [
        EmailTemplateInfoResponseItem(
            id=template["id"],
            name=template["id"].replace("_", " ").title(),
            subject=template["subject"],
            description=template.get("purpose", f"Template for {template['id'].replace('_', ' ')}"),
            placeholders=ai_service._extract_placeholders(template["template"]) # Use helper from AIService
        )
        for template in templates_list
    ]
    return formatted_templates

@router.get("/candidates/{candidate_id}/email-context", response_model=Dict[str, Any])
async def get_candidate_email_context_endpoint(candidate_id: str):
    """Get candidate data for email context"""
    # This endpoint might need more refined Pydantic modeling if the context is stable
    # For now, keeping as Dict[str, Any] as per existing logic
    context = ai_service._get_candidate_email_context_data(candidate_id) # Assumed helper method
    if not context:
        raise HTTPException(status_code=404, detail="Candidate context not found")
    return context

# Placeholder for a generic chat completion endpoint, if needed
@router.post("/chat-completion", response_model=ChatCompletionResponse)
async def chat_completion_endpoint(request_data: ChatCompletionRequest):
    """
    Generic chat completion endpoint.
    The AIService needs a method to handle this, e.g., `call_openai_chat_generic`.
    This example assumes AIService has a method `_call_openai_api` that can be
    adapted or a new one is created.
    """
    if not ai_service.client:
        raise HTTPException(status_code=503, detail="AI service is not available.")
    try:
        # This is a simplified example; you'd likely have a dedicated method in AIService
        # or adapt _call_openai_api for more generic system prompts.
        # For now, we'll just pass the messages through, assuming the first one might be a system prompt.
        
        response = ai_service.client.chat.completions.create(
            model=ai_service.DEFAULT_MODEL, # Or allow model selection from request_data
            messages=[msg.model_dump() for msg in request_data.messages],
            # temperature=request_data.temperature, # If you add to request
        )
        content = response.choices[0].message.content
        if not content:
            raise HTTPException(status_code=500, detail="AI returned empty content.")
        return ChatCompletionResponse(content=content)
    except Exception as e:
        logger.error(f"Error in chat completion: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error in chat completion: {str(e)}")