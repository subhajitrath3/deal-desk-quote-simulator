from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import catalog, quotes

app = FastAPI(title="Deal Desk Quote Simulator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(catalog.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")

@app.get("/health")
def health_check():
    return {"status": "ok"}
