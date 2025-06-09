# TODO: Run this script on your VPS to test if the candidate API is working
# after applying the fixes in todo_fix_candidate_crud.py

import requests
import json
import base64

# Replace with your VPS URL
BASE_URL = "http://localhost:8000/api/v1"

# Function to login and get token - tries multiple admin credentials
def login():
    credentials = [
        {"username": "admin@example.com", "password": "admin123"},
        {"username": "admin@recruitmentplus.com", "password": "admin123"},
        {"username": "newuser2@example.com", "password": "admin123"}
    ]
    
    for creds in credentials:
        print(f"Trying login with {creds['username']}...")
        
        # First try form data (how the API expects it)
        response = requests.post(
            f"{BASE_URL}/auth/login", 
            data=creds
        )
        
        # If that fails, try JSON
        if response.status_code != 200:
            response = requests.post(
                f"{BASE_URL}/auth/login",
                json=creds
            )
        
        if response.status_code == 200:
            print(f"Login successful with {creds['username']}")
            return response.json().get("access_token")
        else:
            print(f"Login failed with {creds['username']}: {response.status_code}")
            try:
                print(f"Response: {response.json()}")
            except:
                print(f"Response: {response.text}")
    
    # If all credentials fail, try a JWT token
    try:
        # Manually create a test JWT token - FOR TESTING ONLY, NOT SECURE!
        # This is just to get past authentication for testing
        dummy_payload = {
            "sub": "admin-user-id",  # You might need a real user ID from your database
            "role": "ADMIN",
            "exp": 1999999999  # Far future expiration
        }
        dummy_header = {"alg": "HS256", "typ": "JWT"}
        
        def create_dummy_jwt():
            header = base64.urlsafe_b64encode(json.dumps(dummy_header).encode()).decode().rstrip("=")
            payload = base64.urlsafe_b64encode(json.dumps(dummy_payload).encode()).decode().rstrip("=")
            # This is not a real signature - just for testing
            signature = base64.urlsafe_b64encode(b"test-signature").decode().rstrip("=")
            return f"{header}.{payload}.{signature}"
        
        print("All login attempts failed, returning test token for debugging")
        return create_dummy_jwt()
    except Exception as e:
        print(f"Error creating test token: {e}")
        return None

# Function to get candidates
def get_candidates(token):
    url = f"{BASE_URL}/candidates"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\nFetching candidates from: {url}")
    print(f"Using Authorization header: Bearer {token[:15]}...")
    
    response = requests.get(url, headers=headers)
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        try:
            data = response.json()
            print(f"\nResponse structure: {json.dumps(list(data.keys()), indent=2)}")
            
            candidates = data.get("candidates", [])
            print(f"Number of candidates: {len(candidates)}")
            
            # Print details of first 3 candidates
            for i, candidate in enumerate(candidates[:3], 1):
                print(f"\nCandidate {i}:")
                print(f"  Email: {candidate.get('email')}")
                print(f"  Name: {candidate.get('first_name')} {candidate.get('last_name')}")
                
                profile = candidate.get("profile", {})
                if profile:
                    print(f"  Current Position: {profile.get('current_position')}")
                    print(f"  Company: {profile.get('current_company')}")
                    print(f"  Experience: {profile.get('years_of_experience')} years")
                else:
                    print("  No profile data")
            
            return data
        except Exception as e:
            print(f"Error parsing response: {e}")
            print(f"Response text: {response.text[:200]}...")
            return None
    else:
        print(f"Failed to get candidates: {response.text}")
        return None

# Main function
def main():
    token = login()
    if token:
        get_candidates(token)
    else:
        print("No valid authentication token available, cannot test API")

if __name__ == "__main__":
    main()