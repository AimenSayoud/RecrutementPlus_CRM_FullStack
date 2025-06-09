-- TODO: Run this SQL query on the VPS to verify candidate profiles are correct
-- TODO: This will show all candidate profiles with the most important fields

SELECT 
    cp.id, 
    u.email,
    u.first_name,
    u.last_name,
    cp.current_position,
    cp.current_company,
    cp.summary,
    cp.years_of_experience,
    cp.location,
    cp.linkedin_url,
    cp.github_url,
    cp.portfolio_url,
    cp.profile_visibility,
    cp.is_open_to_opportunities,
    cp.profile_completed,
    cp.created_at
FROM 
    candidate_profiles cp
JOIN 
    users u ON cp.user_id = u.id
ORDER BY 
    cp.created_at DESC;

-- TODO: If you need to check which columns exist in the table, run:
SELECT 
    column_name 
FROM 
    information_schema.columns 
WHERE 
    table_name = 'candidate_profiles' 
ORDER BY 
    ordinal_position;

-- TODO: To count the number of candidate profiles:
SELECT COUNT(*) FROM candidate_profiles;