from typing import List, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict
import os

class Settings(BaseSettings):
    ENVIRONMENT: str = "dev"
    SUPABASE_URL: str 
    SUPABASE_KEY: str 
    GOOGLE_CLIENT_ID: str 
    GOOGLE_CLIENT_SECRET: str 
    GOOGLE_REDIRECT_URI: str 
    GITHUB_CLIENT_ID: str 
    GITHUB_CLIENT_SECRET: str 
    GITHUB_REDIRECT_URI: str
    JWT_SECRET_KEY: str
    JWT_TOKEN_EXPIRE_MINUTES: int
    FRONTEND_URL: str
    FRONTEND_OAUTH_CALLBACK: str
    RAZORPAY_KEY_ID: str
    RAZORPAY_KEY_SECRET: str
    RAZORPAY_WEBHOOK_SECRET: str
    CORS_ORIGINS: Union[str, List[AnyHttpUrl]] = []
    
    SMTP_SERVER: str = ""
    SMTP_PORT: int = 465 
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_EMAIL: str = ""

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT.lower() == "prod"

    @field_validator("CORS_ORIGINS", mode="before")
    def _cors_origins(cls, v):  
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip().strip("'").strip('"') for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    @property
    def GOOGLE_OAUTH_PAYLOAD(self):
        return {
            "auth_url": "https://accounts.google.com/o/oauth2/token",
            "user_info_url": "https://www.googleapis.com/oauth2/v1/userinfo",
            "client_id": self.GOOGLE_CLIENT_ID,
            "client_secret": self.GOOGLE_CLIENT_SECRET,
            "redirect_uri": self.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

    @property
    def GITHUB_OAUTH_PAYLOAD(self):
        return {
            "auth_url": "https://github.com/login/oauth/access_token",
            "user_info_url": "https://api.github.com/user",
            "client_id": self.GITHUB_CLIENT_ID,
            "client_secret": self.GITHUB_CLIENT_SECRET,
            "redirect_uri": self.GITHUB_REDIRECT_URI,
        }

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=True
    )

settings = Settings()