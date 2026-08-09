from typing import Annotated, Optional
from fastapi import Query, Cookie, Depends, HTTPException
import postgrest
import jwt
from .core.security import extract_jwt_token
from .core.db import supabase as sb
from .schemas.user import User
from .services.user import get_user_by_email


def get_user(strict_auth = True):
    def get_user(session: Annotated[str | None, Cookie()] = None):

        print("session", session)
        if not session: 
            if strict_auth:
                raise HTTPException(status_code=403, detail="you are not authenticated")
            return None
        
        try:
            data = extract_jwt_token(session)
        except jwt.PyJWTError:
            if strict_auth:
                raise HTTPException(status_code=401, detail="Session expired or invalid. Please log in again.")
            return None
        
        user = get_user_by_email(data["email"])

        if not user:
            raise HTTPException(status_code=404, detail="user not found")

        return user
    return get_user

def check_role(allowed_roles: list, strict_auth = True):
    def role_checker(user: User = Depends(get_user(strict_auth))):
        if len(allowed_roles) and (user.role not in allowed_roles and strict_auth):
            raise HTTPException(
                status_code=403,
                detail=f"You are not allowed to perform this operation"
            )
        return user
    return role_checker


def CommonQueryParams(
    search: Optional[str] = Query(None),
    page: int = Query(None, ge=1),
    size: int = Query(10, ge=1),
    sort_by: str = Query(None),
    sort_order: str = Query("asc")
):
    return {
        "search": search,
        "page": page,
        "size": size,
        "sort_by": sort_by,
        "sort_order": sort_order
    }

def query_builder(base_query, search_fields: list[str], params):
    try:
        query_builder = base_query
    
        if params["search"] and search_fields:
            search_term = f"%{params["search"]}%"
            or_conditions = [f"{field}.ilike.{search_term}" for field in search_fields]
            query_builder = query_builder.or_(",".join(or_conditions))
        
        if params["sort_by"]:
            ascending = params["sort_order"].lower() == "desc"
            query_builder = query_builder.order(params["sort_by"], desc=ascending)

        if params["page"]:
            offset = (params["page"] - 1) * params["size"]
            query_builder = query_builder.range(offset, offset + params["size"] - 1)
        
        response = query_builder.execute()

        if not response:
            return None
        
        data = response.data
        count = response.count

        if not params["page"]:
            return {"data": data}

        total_pages = (count + params["size"] - 1) // params["size"] if params["size"] > 0 else 0

        return {
            "page": params["page"],
            "data": data,
            "total_pages": total_pages,
        }
    except postgrest.exceptions.APIError as e:
        if e.code == 416:
            raise HTTPException(detail="Max Page limit exceed", status_code=400)
        raise e
    