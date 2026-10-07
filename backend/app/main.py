import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import catalog, quotes

app = FastAPI(title="Deal Desk Quote Simulator")

# Allow all origins in development; in production set ALLOWED_ORIGINS env var
# e.g. ALLOWED_ORIGINS=https://your-app.vercel.app,https://deal-desk-quote-simulator.vercel.app
allowed_origins_env = os.environ.get("ALLOWED_ORIGINS", "*")
if allowed_origins_env == "*":
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in allowed_origins_env.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
