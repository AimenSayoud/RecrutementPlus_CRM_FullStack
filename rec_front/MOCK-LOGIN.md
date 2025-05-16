# Login Credentials

The application is set up to use the backend's users.json file for authentication. You can use the following credentials to log in:

## Available Users From Backend's fake_data/users.json

### Super Admin
- **Email:** superadmin@recruitmentplus.example
- **Password:** Any password will work (password checking is bypassed)

### Admin
- **Email:** admin@recruitmentplus.example
- **Password:** Any password will work (password checking is bypassed)

### Consultants
- **Email:** consultant1@recruitmentplus.example
- **Email:** consultant2@recruitmentplus.example
- **Password:** Any password will work (password checking is bypassed)

### Candidates
- **Email:** john.doe@example.com
- **Email:** jane.smith@example.com
- **Email:** candidate1@recruitmentplus.example
- **Password:** Any password will work (password checking is bypassed)

### Employers
- **Email:** marie.dupont@techinnovations.example
- **Email:** pierre.martin@msggroup.example
- **Password:** Any password will work (password checking is bypassed)

## Mock Data Setup

The application is currently set up to use mock data by default:

1. The environment variable `NEXT_PUBLIC_USE_MOCK_DATA` is set to `true` in `.env.local`
2. The `USE_BACKEND` flag in `src/lib/api-combined.ts` is set to `false` to force using mock data

## Testing Different User Roles

To test different roles and permissions:

1. **Super Admin (admin@example.com):**
   - Has access to all offices and features
   - Can view and manage all users, candidates, companies, and jobs

2. **Office Manager (manager@example.com):**
   - Has access to their assigned office only
   - Can manage candidates, companies, and jobs within their office

3. **Regular Employee (employee@example.com):**
   - Has limited access to functionality
   - Can view and work with candidates and jobs but has restricted edit permissions

## Switching to Real Backend

When you're ready to connect to the real backend:

1. Set `NEXT_PUBLIC_USE_MOCK_DATA=false` in `.env.local`
2. Change `USE_BACKEND` to `true` in `src/lib/api-combined.ts`
3. Ensure your backend server is running at the URL specified in `NEXT_PUBLIC_API_BASE_URL`