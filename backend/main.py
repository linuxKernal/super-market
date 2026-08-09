from fastapi import status
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from .routers import auth, cart, categories, products, user, payment, orders, dashboard
from .core.config import settings
from .core.logs import logger
import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        yield
    except asyncio.CancelledError:
        pass

app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[str(origin).rstrip("/") for origin in settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    status_code = exc.status_code

    if isinstance(exc.detail, str):
        error_message = exc.detail
    else:
        error_message = "An unknown error occurred." 
        
    custom_response = {
        "status": "error",
        "error": error_message
    }
    
    return JSONResponse(
        status_code=status_code,
        content=custom_response
    )

@app.exception_handler(Exception)
async def exception_handler(request: Request, exc: Exception):
    logger.error(f"Unexpected error occurred: {request.url.path}: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected internal server error occurred. Please try again later."}
    )

app.include_router(auth.router)
app.include_router(cart.router)
app.include_router(products.router)
app.include_router(categories.router)
app.include_router(user.router)
app.include_router(prefix="/payment", router=payment.router)
app.include_router(prefix="/orders", router=orders.router)
app.include_router(prefix="/dashboard", router=dashboard.router)
