from fastapi import APIRouter
from app.services.pricing import load_catalog

router = APIRouter()

@router.get("/catalog")
def get_catalog():
    return load_catalog()
