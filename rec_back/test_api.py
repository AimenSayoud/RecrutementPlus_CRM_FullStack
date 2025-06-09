import requests
import json

# Base URL
base_url = "http://localhost:8000/api/v1"

# Function to login and get token
def login():
    url = f"{base_url}/auth/login"
    
    # Try with admin@example.com first
    data = {
        "username": "admin@example.com",
        "password": "admin123"
    }
    response = requests.post(url, json=data)
    print(f"Login response status for admin@example.com: {response.status_code}")
    
    if response.status_code == 200:
        return response.json().get("access_token")
    
    # If that fails, try with superadmin
    data = {
        "username": "admin@recruitmentplus.com",
        "password": "admin123"
    }
    response = requests.post(url, json=data)
    print(f"Login response status for admin@recruitmentplus.com: {response.status_code}")
    
    try:
        return response.json().get("access_token")
    except:
        print(f"Login failed: {response.text}")
        return None

# Function to get candidates
def get_candidates(token):
    url = f"{base_url}/candidates"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Candidates API status code: {response.status_code}")
    try:
        data = response.json()
        print(f"Candidates response: {json.dumps(data, indent=2)}")
        print(f"Number of candidates: {len(data.get('candidates', []))}")
        return data
    except:
        print(f"Failed to parse candidates response: {response.text}")
        return None

# Function to get companies
def get_companies(token):
    url = f"{base_url}/companies"
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(url, headers=headers)
    print(f"Companies API status code: {response.status_code}")
    try:
        data = response.json()
        print(f"Companies response: {json.dumps(data, indent=2)}")
        print(f"Number of companies: {len(data.get('companies', []))}")
        return data
    except:
        print(f"Failed to parse companies response: {response.text}")
        return None

# Main function
def main():
    token = login()
    if token:
        print(f"Got token: {token[:15]}...")
        candidates = get_candidates(token)
        companies = get_companies(token)
    else:
        print("Couldn't get token, skipping API calls")

if __name__ == "__main__":
    main()