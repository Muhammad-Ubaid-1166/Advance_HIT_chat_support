import os
from fastapi import FastAPI
from fastapi.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import time
import logging

logger = logging.getLogger("uvicorn.access")
logger.disabled = True


def register_middleware(app: FastAPI):

    @app.middleware("http")
    async def custom_logging(request: Request, call_next):
        start_time = time.time()

        response = await call_next(request)
        processing_time = time.time() - start_time

        message = f"{request.client.host}:{request.client.port} - {request.method} - {request.url.path} - {response.status_code} completed after {processing_time}s"

        print(message)
        return response

    # ─── CORS Origins from environment variable ─────────────────────────
    cors_origins_str = os.getenv("CORS_ORIGINS", "*")
    cors_origins = [origin.strip() for origin in cors_origins_str.split(",")]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=True,
    )

    # ─── Trusted Hosts from environment variable ────────────────────────
    trusted_hosts_str = os.getenv("TRUSTED_HOSTS", "localhost,127.0.0.1,0.0.0.0")
    trusted_hosts = [host.strip() for host in trusted_hosts_str.split(",")]

    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=trusted_hosts,
    )
