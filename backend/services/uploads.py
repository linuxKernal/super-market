import secrets
from datetime import datetime, timezone
from fastapi import UploadFile, HTTPException
from ..core.db import supabase as sb
from slugify import slugify
from ..utils import BUCKET_NAME

async def upload_image(
    file: UploadFile, 
    folder: str | None, 
) -> str:

    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=400, 
            detail="File must be an image"
        )

    MAX_FILE_SIZE = 5 * 1024 * 1024
    file_bytes = await file.read(MAX_FILE_SIZE + 1)
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="File size exceeds the 5MB limit"
        )
    
    timestamp = int(datetime.now(timezone.utc).timestamp())
    random_str = secrets.token_hex(3)
    file_extension = file.filename.split(".")[-1]
    file_name = f"{slugify(file.filename.split('.')[0])}_{timestamp}-{random_str}.{file_extension}"

    file_path = f"{folder}/{file_name}" if folder else f"{file_name}"

    sb.storage.from_(BUCKET_NAME).upload(
        file_path, file_bytes, {"content-type": file.content_type, "upsert": "true"},
    )

    public_url = sb.storage.from_(BUCKET_NAME).get_public_url(file_path)

    return public_url
