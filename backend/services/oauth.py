import requests

def oauth_data(code: str, payload: dict, provider = None):
    data = {
        "code": code,
        "client_id": payload["client_id"],
        "client_secret": payload["client_secret"],
        "redirect_uri": payload["redirect_uri"]
    }
    if "grant_type" in payload:
        data["grant_type"] = payload["grant_type"]
    
    response = requests.post(payload["auth_url"], data=data, headers={"Accept": "application/json"}).json()
    access_token = response.get("access_token")
    user_info = requests.get(payload["user_info_url"], headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"}).json()

    if not user_info.get("email") and provider == "github":
        emails = requests.get("https://api.github.com/user/emails", headers={"Authorization": f"Bearer {access_token}"}).json()
        primary_email = "not present"
        for e in emails:
            if e.get("primary"):
                primary_email = e.get("email")
                break
        
        user_info["email"] = primary_email
    
    return user_info