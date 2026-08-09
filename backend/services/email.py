import smtplib
from email.message import EmailMessage
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

def send_password_reset_email(to_email: str, reset_link: str) -> bool:
    if not settings.SMTP_USER:
        logger.error("SMTP Configuration is missing in environment variables.")
        return False

    try:
        msg = EmailMessage()
        msg['Subject'] = "Password Reset Request"
        msg['From'] = settings.SMTP_USER
        msg['To'] = to_email
        
        msg.set_content(f"""
            Hi there,

            You recently requested to reset your password. Please click the link below to set a new password:

            {reset_link}

            If you did not request this, please ignore this email.
                    """)
        print("SMTP_PORT", settings.SMTP_PORT)
        with smtplib.SMTP_SSL(settings.SMTP_SERVER, settings.SMTP_PORT) as server:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
            
        logger.info(f"Password reset email sent to {to_email}")
        return True
    
    except Exception as e:
        print(e)
        logger.error(f"Failed to send email to {to_email}: {e}")
        return False
