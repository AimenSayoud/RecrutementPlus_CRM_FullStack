# TODO: Run this script on the VPS to test if the candidates API is working correctly
# TODO: This will attempt to login and fetch candidates from the API

import requests
import json

# TODO: Update this URL to match your VPS domain
base_url = "http://localhost:8000/api/v1"

# Function to login and get token
def login():
    url = f"{base_url}/auth/login"
    
    # TODO: Replace with a valid admin user for your VPS
    data = {
        "username": "admin@example.com",  # Replace with valid admin email
        "password": "admin123"           # Replace with valid admin password
    }
    
    print(f"Attempting login with {data['username']}...")
    response = requests.post(url, data=data)
    print(f"Login response status: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Login failed: {response.text}")
        # TODO: Try alternative credentials if the first ones fail
        return None
        
    token_data = response.json()
    return token_data.get("access_token")

# Function to get candidates
def get_candidates(token):
    url = f"{base_url}/candidates"
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"Fetching candidates from API...")
    response = requests.get(url, headers=headers)
    print(f"Candidates API status code: {response.status_code}")
    
    if response.status_code != 200:
        print(f"Failed to get candidates: {response.text}")
        return None
        
    data = response.json()
    candidates = data.get("candidates", [])
    print(f"Successfully retrieved {len(candidates)} candidates")
    
    # Print the first 3 candidates (if available)
    for i, candidate in enumerate(candidates[:3], 1):
        print(f"\n--- Candidate {i} ---")
        print(f"ID: {candidate.get('id')}")
        print(f"Name: {candidate.get('first_name')} {candidate.get('last_name')}")
        print(f"Position: {candidate.get('current_position')}")
        print(f"Company: {candidate.get('current_company')}")
    
    return candidates

# Main function
def main():
    # TODO: Login to get authentication token
    token = login()
    if not token:
        print("Login failed. Please check credentials.")
        return
        
    print(f"Login successful, received token")
    
    # TODO: Fetch candidates using the token
    candidates = get_candidates(token)
    if not candidates:
        print("Failed to retrieve candidates or no candidates found")
    else:
        print(f"\nTotal candidates retrieved: {len(candidates)}")

if __name__ == "__main__":
    main()