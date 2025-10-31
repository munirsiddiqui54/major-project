import os
import shutil
import subprocess
import json
from pathlib import Path
from typing import Any, Dict

import requests


def _run(cmd: list[str], cwd: str | None = None) -> None:
    subprocess.run(cmd, cwd=cwd, check=True)


def deploy_to_render(
    project_root: str,
    *,
    project_name: str | None = None,
) -> Dict[str, Any]:
    """
    Pushes the given Node project to a repo subfolder and deploys it on Render.
    Returns a dict with push and render API results.
    Values fall back to environment variables if not provided:
      GITHUB_REPO, GITHUB_TOKEN, RENDER_API_KEY, USER_ID
    """
    print("START DEPLOY TO RENDER")
    project_name = project_name or os.path.basename(project_root.rstrip("/\\"))
    owner = os.getenv("GITHUB_OWNER")
    github_token = os.getenv("GITHUB_TOKEN")
    render_api_key = os.getenv("RENDER_API_KEY")
    branch = os.getenv("GIT_BRANCH", "main")
    region = os.getenv("RENDER_REGION", "oregon")
    build_command = os.getenv("BUILD_COMMAND", "npm install")
    start_command = os.getenv("START_COMMAND", "node src/index.js")
    service_name = os.getenv("RENDER_SERVICE_NAME", project_name)

    if not (owner and github_token and render_api_key):
        raise ValueError("Missing required credentials: GITHUB_OWNER, GITHUB_TOKEN, RENDER_API_KEY")

    github_repo = f"https://github.com/{owner}/fraxon-projects.git"
    print("1")

    if not os.path.isdir(project_root):
        raise FileNotFoundError(f"Project path does not exist: {project_root}")

    clone_dir = os.path.join(os.getcwd(), "temp_repo")
    print(clone_dir)
    if os.path.exists(clone_dir):
        shutil.rmtree(clone_dir)

    # Clone with token in URL
    clone_url = github_repo.replace("https://", f"https://{github_token}@")
    print(clone_url)
    _run(["git", "clone", clone_url, clone_dir])
    print("2")

    # Ensure branch exists/checked out (especially for empty repos)
    try:
        _run(["git", "checkout", "-B", branch], cwd=clone_dir)
    except Exception:
        pass

    # Replace repository root contents (except .git) with project contents
    for item in os.listdir(clone_dir):
        if item == ".git":
            continue
        path = os.path.join(clone_dir, item)
        if os.path.isdir(path):
            shutil.rmtree(path)
        else:
            os.remove(path)
    print("3")


    # Copy project files into repo root
    for root, dirs, files in os.walk(project_root):
        rel = os.path.relpath(root, project_root)
        target_dir = clone_dir if rel == "." else os.path.join(clone_dir, rel)
        os.makedirs(target_dir, exist_ok=True)
        for f in files:
            src_f = os.path.join(root, f)
            dst_f = os.path.join(target_dir, f)
            shutil.copy2(src_f, dst_f)

    # Commit and push
    # Configure git identity if not set
    git_user_name = os.getenv("GIT_USER_NAME", "fraxon-bot")
    git_user_email = os.getenv("GIT_USER_EMAIL", "fraxon-bot@example.com")
    try:
        _run(["git", "config", "user.name", git_user_name], cwd=clone_dir)
        _run(["git", "config", "user.email", git_user_email], cwd=clone_dir)
    except Exception:
        pass

    _run(["git", "add", "."], cwd=clone_dir)
    print("git added...")
    # Commit may fail if no changes; ignore that specific case
    try:
        _run(["git", "commit", "-m", f"Deploy {project_name} app"], cwd=clone_dir)
        print("git commmit...")
    except subprocess.CalledProcessError:
        # no changes to commit
        pass
    # Ensure upstream and push
    try:
        _run(["git", "push", "-u", "origin", branch], cwd=clone_dir)
    except subprocess.CalledProcessError:
        _run(["git", "push", "origin", branch], cwd=clone_dir)
    print("git pushed...")

    # Trigger Render deployment
    headers = {
        "Authorization": f"Bearer {render_api_key}",
        "Accept": "application/json",
        "Content-Type": "application/json",
    }
    service_data = {
        "serviceDetails": {
            "name": service_name,
            "type": "web_service",
            "repo": {
                "url": github_repo,
                "branch": branch,
            },
            "env": "node",
            "region": region,
            "buildCommand": build_command,
            "startCommand": start_command,
            "autoDeploy": True,
        }
    }

    resp = requests.post(
        "https://api.render.com/v1/services",
        headers=headers,
        data=json.dumps(service_data),
        timeout=60,
    )

    result = {
        "push": {
            "repo": github_repo,
            "branch": branch,
        },
        "render": {
            "status_code": resp.status_code,
            "body": resp.json() if resp.headers.get("content-type", "").startswith("application/json") else resp.text,
        },
    }

    if resp.status_code not in (200, 201):
        raise RuntimeError(f"Render deployment failed: {resp.status_code} {resp.text}")
    print(result)
    return result


