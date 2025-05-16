# RecrutementPlus CRM Full Stack

A full-stack recruitment CRM system with Next.js frontend and FastAPI backend.

## Project Structure

- `rec_front/` - Next.js frontend application
- `rec_back/` - FastAPI backend application

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd rec_back
   ```

2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Run the backend server:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd rec_front
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file with the following content:
   ```
   NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
   NEXT_PUBLIC_USE_MOCK_DATA=false
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## Testing the Integration

1. Make sure both backend and frontend servers are running
2. Navigate to http://localhost:3000/test-api
3. Test the login functionality with:
   - Email: `superadmin@recruitmentplus.example`
   - Password: `password`
4. Test fetching companies data

## Available Test Users

- SuperAdmin: `superadmin@recruitmentplus.example` / `password`
- Admin: `admin@recruitmentplus.example` / `password`
- Consultant: `consultant1@recruitmentplus.example` / `password`
- Employer: `marie.dupont@techinnovations.example` / `password`

## API Endpoints

### Backend (http://localhost:8000)

- `/api/v1/users` - User management
- `/api/v1/companies` - Company management
- `/api/v1/candidates` - Candidate management
- `/api/v1/jobs` - Job management
- `/api/v1/skills` - Skills management

### Frontend Routes

- `/` - Dashboard
- `/login` - Login page
- `/companies` - Companies list
- `/candidates` - Candidates list
- `/team` - Team management
- `/test-api` - API integration test page

## Features

- User authentication with role-based access control
- Company profiles management
- Candidate profiles management
- Job postings management
- Team collaboration tools
- AI-powered assistance (under development)

## Tech Stack

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- Zustand (state management)

### Backend
- FastAPI
- Python 3.x
- JSON file-based data storage (for development)

## Development Notes

- The backend uses JSON files for data storage in development
- All passwords in the fake data are set to "password" for testing
- CORS is enabled for development (allow all origins)
- The frontend can work with both real API and mock data