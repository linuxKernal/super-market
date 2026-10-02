from google.cloud import recaptchaenterprise_v1
from google.oauth2 import service_account
from fastapi import HTTPException, status
from ..core.config import settings
from ..core.logs import logger

def verify_recaptcha_token(
    token: str,
    expected_action: str,
    user_ip: str | None = None,
    user_agent: str | None = None,
) -> float:
    """
    Returns the risk score (0.0 = high risk, 1.0 = low risk / human).
    """
    credentials = service_account.Credentials.from_service_account_file(settings.GOOGLE_APPLICATION_CREDENTIALS)

    client = recaptchaenterprise_v1.RecaptchaEnterpriseServiceClient(credentials=credentials)

    parent = f"projects/{settings.GCP_PROJECT_ID}"

    event = recaptchaenterprise_v1.Event(
        token=token,
        site_key=settings.RECAPTCHA_SITE_KEY,
        expected_action=expected_action,
        user_ip_address=user_ip,
        user_agent=user_agent,
    )

    assessment = recaptchaenterprise_v1.Assessment(event=event)

    try:
        response = client.create_assessment(
            request={"parent": parent, "assessment": assessment}
        )
    except Exception as e:
        logger.error(f"Failed to communicate with reCAPTCHA Enterprise service: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to communicate with reCAPTCHA Enterprise service: {str(e)}"
        )

    # 1. Validate token integrity
    if not response.token_properties.valid:
        invalid_reason = response.token_properties.invalid_reason.name
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid reCAPTCHA token. Reason: {invalid_reason}"
        )

    # 2. Validate expected action match
    if response.token_properties.action != expected_action:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                f"reCAPTCHA action mismatch. Expected '{expected_action}', "
                f"got '{response.token_properties.action}'."
            )
        )

    # 3. Evaluate risk score
    score = response.risk_analysis.score
    reasons = [reason.name for reason in response.risk_analysis.reasons]

    if score < settings.MIN_RECAPTCHA_SCORE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={
                "error": "reCAPTCHA risk score too low. Request blocked.",
                "score": score,
                "reasons": reasons
            }
        )

    return score