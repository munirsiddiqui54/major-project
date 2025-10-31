import os
import shutil
import re

def create_dir(path):
    """Creates a directory if it does not already exist."""
    if not os.path.exists(path):
        os.makedirs(path)
        print(f"CREATED DIR: {path}")

def create_file(path, content=""):
    """Creates a file with the given content. Overwrites if it exists."""
    with open(path, "w") as f:
        f.write(content)
    print(f"CREATED FILE: {path}")

def clean_project_directory(path):
    """Deletes the project directory if it exists to start fresh."""
    if os.path.exists(path):
        shutil.rmtree(path)
        print(f"REMOVED DIR: {path}")

def clean_llm_code_output(raw_code):
    """Cleans the raw output from the LLM to extract only the code block."""
    # The regex pattern looks for a code block starting with ```javascript and ending with ```
    match = re.search(r"```javascript(.*?)```", raw_code, re.DOTALL)
    if match:
        # Return the captured group, stripping any leading/trailing whitespace
        return match.group(1).strip()
    # If no markdown block is found, assume the whole string is code and strip it
    return raw_code.strip()

def hello():
    print("Hello World!")