from flask import Blueprint, request
import os

from ..services.render_deploy_service import deploy_to_render


deploy_render_bp = Blueprint("deploy_render", __name__)


@deploy_render_bp.post("/deploy/render")
def deploy_render():
    body = request.get_json(silent=True) or {}
    project_name = body.get("projectName") or os.getenv("PROJECT_NAME", "generated-api")

    project_root = os.path.join(os.getcwd(), "projects", "generated-api")

    try:
        result = deploy_to_render(
            project_root,
            project_name=project_name,
        )
        return result, 200
    except Exception as e:
        return {"message": "Deployment failed", "error": str(e)}, 500


