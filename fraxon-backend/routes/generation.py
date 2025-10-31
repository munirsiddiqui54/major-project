from flask import Blueprint, request
from . import __name__ as routes_name  # ensure package resolution
from ..services.generation_service import generate_backend

generation_bp = Blueprint("generation", __name__)


@generation_bp.post("/generate")
def generate():
    print("ENDPOINT HIT")
    payload = request.get_json(silent=True) or {}
    graph_state = payload.get("graphState") or payload
    result = generate_backend(graph_state)
    return result, 200


