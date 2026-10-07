import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import catalog, quotes

app = FastAPI(title="Deal Desk Quote Simulator")

# In production, set ALLOWED_ORIGINS to the exact Vercel frontend URL.
# e.g. ALLOWED_ORIGINS=https://deal-desk-quote-simulator.vercel.app
# Multiple origins: ALLOWED_ORIGINS=http://localhost:3000,https://deal-desk-quote-simulator.vercel.app
#
# IMPORTANT: combining allow_origins=["*"] with allow_credentials=True is invalid
# per the CORS spec — browsers will block such responses. When the env var is
# absent or set to "*", we fall back to wildcard WITHOUT credentials so that
# local development still works. In production always provide explicit origins.
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "").strip()

if not _raw_origins or _raw_origins == "*":
    # Development / unconfigured: wildcard, no credentials
    allow_origins = ["*"]
    allow_credentials = False
else:
    # Production: explicit list, trim whitespace and trailing slashes
    allow_origins = [
        origin.strip().rstrip("/")
        for origin in _raw_origins.split(",")
        if origin.strip()
    ]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
