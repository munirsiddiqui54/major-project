import json
from ..agents import ArchitectAgent, LLMCoderAgent, DocumenterAgent


def generate_backend(graph_state: dict) -> dict:
    print("PRINT GRAPH:",graph_state)
    if not isinstance(graph_state, dict):
        try:
            graph_state = json.loads(graph_state)
        except Exception:
            raise ValueError("graphState must be an object or JSON string")

    architect = ArchitectAgent(graph_state)
    project_path = architect.run()

    print("start coding...")
    

    coder = LLMCoderAgent(graph_state, project_path)
    coder.run()

    
    print("done coding...")

    documenter = DocumenterAgent(graph_state, project_path)
    documenter.run()

    return {
        "message": "Multi-agent backend generation complete",
        "projectPath": project_path,
        "projectName": graph_state.get("projectName"),
    }


