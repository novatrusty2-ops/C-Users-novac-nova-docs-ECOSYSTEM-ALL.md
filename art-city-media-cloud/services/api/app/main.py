from __future__ import annotations

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import assets, auth, jobs, search, uploads, workspaces

settings = get_settings()

app = FastAPI(
    title="Art City Media Cloud API",
    version="0.1.0",
    description="Phase 1 foundation: identity, assets, uploads, processing jobs, search, audit.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def correlation_middleware(request: Request, call_next):
    correlation_id = request.headers.get("X-Correlation-ID") or request.headers.get("x-correlation-id")
    response = await call_next(request)
    if correlation_id:
        response.headers["X-Correlation-ID"] = correlation_id
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    # Keep FastAPI HTTPException behavior; this catches unexpected errors.
    from fastapi import HTTPException

    if isinstance(exc, HTTPException):
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/health")
def health():
    return {"status": "ok", "service": "artcity-api", "env": settings.app_env}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(assets.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(search.router, prefix="/api/v1")
app.include_router(jobs.jobs_router, prefix="/api/v1")
app.include_router(workspaces.router, prefix="/api/v1")
