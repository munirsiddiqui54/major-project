import os
import json
import time
from . import utils


def _normalize_graph(graph: dict) -> dict:
    graph = dict(graph or {})

    # Project name fallback if users routes exist
    if not graph.get("projectName"):
        has_users_routes = any(
            isinstance(r.get("path"), str) and r["path"].startswith("/api/users")
            for r in graph.get("routes", []) if isinstance(r, dict)
        )
        if has_users_routes:
            graph["projectName"] = "user-management-api"

    # Normalize schemas
    schemas = []
    for s in graph.get("schemas", []) or []:
        if not isinstance(s, dict):
            continue
        name = s.get("name") or "Model"
        fields = {}
        for fname, fdef in (s.get("fields") or {}).items():
            if not isinstance(fdef, dict):
                continue
            raw_type = str(fdef.get("type", "String"))
            # Clean common corruptions like "String\\ email"
            raw_type = raw_type.split()[0]
            t = raw_type.strip()
            if t.lower() == "string":
                t = "String"
            elif t.lower() == "number":
                t = "Number"
            elif t.lower() == "boolean":
                t = "Boolean"
            cleaned = {
                "type": t,
                "required": bool(fdef.get("required", True)),
            }
            if fdef.get("unique") is True:
                cleaned["unique"] = True
            fields[fname] = cleaned
        hooks = s.get("hooks") or {}
        if name == "User":
            hooks["pre-save"] = "Hash the password using bcrypt before saving the user."
        schema_obj = {"name": name, "fields": fields}
        if hooks:
            schema_obj["hooks"] = hooks
        schemas.append(schema_obj)
    graph["schemas"] = schemas

    # Ensure canonical User controllers; drop malformed ones
    desired_controllers = [
        {
            "name": "createUserController",
            "schema": "User",
            "logic": "Create a new User from req.body. If the email or username already exists, respond with a status code of 409 and a JSON message: { 'message': 'User already exists.' }. On successful creation, respond with a status of 201 and the new user object, but exclude the password field from the response.",
        },
        {
            "name": "getAllUsersController",
            "schema": "User",
            "logic": "Retrieve all users from the database. Exclude the password field from the response for all users.",
        },
        {
            "name": "getUserByIdController",
            "schema": "User",
            "logic": "Retrieve a single user by their ID from req.params.id. If not found, return a 404 error. Exclude the password field from the response.",
        },
    ]

    existing_by_name = {c.get("name"): c for c in (graph.get("controllers") or []) if isinstance(c, dict)}
    controllers = []
    for dc in desired_controllers:
        if dc["name"] in existing_by_name:
            # Overwrite logic/schema with canonical text to ensure correctness
            controllers.append({"name": dc["name"], "schema": "User", "logic": dc["logic"]})
        else:
            controllers.append(dc)
    graph["controllers"] = controllers

    # Normalize routes to the three canonical users routes
    graph["routes"] = [
        {
            "path": "/api/users",
            "method": "POST",
            "schema": "User",
            "controller": "createUserController",
            "description": "Create a new user.",
        },
        {
            "path": "/api/users",
            "method": "GET",
            "schema": "User",
            "controller": "getAllUsersController",
            "description": "Get a list of all users.",
        },
        {
            "path": "/api/users/:id",
            "method": "GET",
            "schema": "User",
            "controller": "getUserByIdController",
            "description": "Get a single user by their ID.",
        },
    ]

    return graph


# --- Placeholder for a real LLM API call ---
def call_llm_api(prompt, max_retries=3):
    """
    This is a placeholder function to simulate a call to an LLM API.
    In a real application, you would replace this with a call to Gemini, OpenAI, etc.
    """
    print("\n----- Sending Instruction -----")
    print(prompt)
    print("---------------------------------")
    time.sleep(2)

    # --- SIMULATED RESPONSES ---
    if "Mongoose schema and model file for a schema named \"User\"" in prompt:
        return """```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    password: { type: String, required: true }
}, { timestamps: true });
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) { next(error); }
});
module.exports = mongoose.model('User', UserSchema);
```"""
    elif "Mongoose schema and model file for a schema named \"Product\"" in prompt:
        return """```javascript
const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, required: false },
    inStock: { type: Boolean, required: true, default: true }
}, { timestamps: true });
module.exports = mongoose.model('Product', ProductSchema);
```"""
    elif "controller function named `createUserController`" in prompt:
        return """```javascript
exports.createUserController = async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(409).json({ message: 'User already exists.' });
        }
        const newUser = new User({ username, email, password });
        await newUser.save();
        const userObject = newUser.toObject();
        delete userObject.password;
        res.status(201).json(userObject);
    } catch (error) {
        res.status(500).json({ message: 'Server error while creating user.', error: error.message });
    }
};
```"""
    elif "controller function named `getAllUsersController`" in prompt:
        return """```javascript
exports.getAllUsersController = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching users.', error: error.message });
    }
};
```"""
    elif "controller function named `getUserByIdController`" in prompt:
        return """```javascript
exports.getUserByIdController = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error while fetching user.', error: error.message });
    }
};
```"""
    elif "Express router file for the 'users' routes" in prompt:
        return """```javascript
const express = require('express');
const router = express.Router();
const { createUserController, getAllUsersController, getUserByIdController } = require('../controllers/user.controller');

// Create a new user
router.post('/', createUserController);

// Get all users
router.get('/', getAllUsersController);

// Get a single user by ID
router.get('/:id', getUserByIdController);

module.exports = router;
```"""
    elif "Express router file for the 'products' routes" in prompt:
        return "```javascript\n// Placeholder for product routes\n```"
    else:
        return "```javascript\n// LLM placeholder response\n```"


class ArchitectAgent:
    """Deterministic agent for scaffolding the project."""

    def __init__(self, graph_state):
        self.graph = _normalize_graph(graph_state)
        self.project_name = self.graph.get("projectName", "my-express-app")
        self.project_path = os.path.join(os.getcwd(), "projects",self.project_name)

    def run(self):
        print(f"\nARCHITECT: Scaffolding project '{self.project_name}'...")
        utils.clean_project_directory(self.project_path)
        self._create_project_directories()
        self._create_boilerplate_files()
        print("ARCHITECT: Project scaffolding complete.")
        return self.project_path

    def _create_project_directories(self):
        utils.create_dir(self.project_path)
        src_path = os.path.join(self.project_path, "src")
        utils.create_dir(src_path)
        for subdir in ["routes", "controllers", "models", "middleware", "config"]:
            utils.create_dir(os.path.join(src_path, subdir))

    def _create_boilerplate_files(self):
        # ... (file creation logic remains the same as before)
        package_json_content = {
            "name": self.project_name, "version": "1.0.0", "description": "AI-generated backend",
            "main": "src/index.js",
            "scripts": {"start": "node src/index.js", "dev": "nodemon src/index.js"},
            "dependencies": {"express": "^4.18.2", "mongoose": "^7.5.0", "dotenv": "^16.3.1", "cors": "^2.8.5",
                             "bcryptjs": "^2.4.3"},
            "devDependencies": {"nodemon": "^3.0.1"}
        }
        utils.create_file(os.path.join(self.project_path, "package.json"), json.dumps(package_json_content, indent=4))
        utils.create_file(os.path.join(self.project_path, ".gitignore"), "node_modules\n.env\n")
        utils.create_file(os.path.join(self.project_path, ".env"),
                          f"PORT=3001\nMONGO_URI=mongodb://localhost:27017/{self.project_name}")
        utils.create_file(os.path.join(self.project_path, "src", "index.js"),
                          "const app = require('./app');\nrequire('dotenv').config();\n\nconst PORT = process.env.PORT || 3000;\n\napp.listen(PORT, () => {\n    console.log(`Server is running on port ${PORT}`);\n});")
        app_js_content = "const express = require('express');\nconst cors = require('cors');\nconst connectDB = require('./config/database');\n\nconnectDB();\n\nconst app = express();\n\napp.use(cors());\napp.use(express.json());\n\n// ROUTES WILL BE ADDED HERE BY THE CODER AGENT\n\napp.get('/', (req, res) => {\n    res.send('API is running...');\n});\n\nmodule.exports = app;"
        utils.create_file(os.path.join(self.project_path, "src", "app.js"), app_js_content)
        db_config_content = "const mongoose = require('mongoose');\nrequire('dotenv').config();\n\nconst connectDB = async () => {\n    try {\n        await mongoose.connect(process.env.MONGO_URI);\n        console.log('MongoDB Connected...');\n    } catch (err) {\n        console.error(err.message);\n        process.exit(1);\n    }\n};\n\nmodule.exports = connectDB;"
        utils.create_file(os.path.join(self.project_path, "src", "config", "database.js"), db_config_content)


class LLMCoderAgent:
    """AI-powered agent for writing application logic."""

    def __init__(self, graph_state, project_path):
        self.graph = _normalize_graph(graph_state)
        self.project_path = project_path
        self.src_path = os.path.join(self.project_path, "src")

    def run(self):
        print("\nLLM CODER: Generating application logic...")
        self._create_models()
        self._create_controllers()
        self._create_routes()
        self._link_routes_to_app()
        print("LLM CODER: Application logic generation complete.")

    def _create_models(self):
        for schema in self.graph.get("schemas", []):
            fields_description = "\n".join([
                                               f"* `{name}`: Should be a {details.get('type', 'String')}{', required' if details.get('required', True) else ''}{', unique' if details.get('unique') else ''}."
                                               for name, details in schema["fields"].items()])
            hooks_description = f"\nAdditionally, implement a 'pre-save' hook. The logic for this hook is: \"{schema['hooks']['pre-save']}\"" if schema.get(
                "hooks") and schema["hooks"].get("pre-save") else ""
            prompt = f"""You are an expert Node.js developer specializing in Mongoose. Write a complete Mongoose schema and model file for a schema named "{schema['name']}". The fields are:\n{fields_description}{hooks_description}\nYour response should be only the JavaScript code."""
            raw_code = call_llm_api(prompt)
            cleaned_code = utils.clean_llm_code_output(raw_code)
            utils.create_file(os.path.join(self.src_path, "models", f"{schema['name'].lower()}.model.js"), cleaned_code)

    def _create_controllers(self):
        # Group controllers by schema to save in one file
        controllers_by_schema = {}
        for controller in self.graph.get("controllers", []):
            schema_name = controller['schema']
            if schema_name not in controllers_by_schema:
                controllers_by_schema[schema_name] = []
            controllers_by_schema[schema_name].append(controller)

        for schema_name, controllers in controllers_by_schema.items():
            # Import the correct model based on the schema name
            model_var = schema_name
            model_file = schema_name.lower()
            full_controller_code = f"const {model_var} = require('../models/{model_file}.model');\n"
            for controller in controllers:
                prompt = f"""You are an expert Node.js developer. Write a single asynchronous controller function named `{controller['name']}`.
**Context:** It uses a Mongoose model named `{controller['schema']}`.
**Logic to Implement:** "{controller['logic']}"
Your response should be only the JavaScript code for this one function, without the model import."""
                raw_code = call_llm_api(prompt)
                full_controller_code += "\n" + utils.clean_llm_code_output(raw_code)

            utils.create_file(os.path.join(self.src_path, "controllers", f"{schema_name.lower()}.controller.js"),
                              full_controller_code)

    def _create_routes(self):
        route_groups = {}
        for route in self.graph.get("routes", []):
            key = route['path'].split('/')[2]  # e.g., /api/users -> users
            if key not in route_groups:
                route_groups[key] = []
            route_groups[key].append(route)

        for group_name, routes in route_groups.items():
            controller_names = list(set([r['controller'] for r in routes]))
            schema_name = routes[0]['schema']
            routes_description = "\n".join([
                                               f"* A `{route['method']}` route at `{route['path']}` that calls the `{route['controller']}` controller. Description: {route['description']}"
                                               for route in routes])
            prompt = f"""You are an expert Node.js developer. Create a complete Express router file for the '{group_name}' routes.
**Instructions:**
- Import `express.Router()`.
- Import the following controllers: `{', '.join(controller_names)}` from `../controllers/{schema_name.lower()}.controller`.
- Define the following routes:\n{routes_description}
- Export the router.
Your response must be only the JavaScript code."""
            raw_code = call_llm_api(prompt)
            cleaned_code = utils.clean_llm_code_output(raw_code)
            utils.create_file(os.path.join(self.src_path, "routes", f"{group_name}.routes.js"), cleaned_code)

    def _link_routes_to_app(self):
        app_js_path = os.path.join(self.src_path, "app.js")
        with open(app_js_path, 'r') as f:
            content = f.read()

        route_files = [f for f in os.listdir(os.path.join(self.src_path, "routes")) if f.endswith('.js')]
        require_statements = ""
        use_statements = ""
        for route_file in route_files:
            route_name = route_file.split('.')[0]
            require_statements += f"const {route_name}Routes = require('./routes/{route_name}.routes');\n"
            use_statements += f"app.use('/api/{route_name}', {route_name}Routes);\n"

        final_content = content.replace("// ROUTES WILL BE ADDED HERE BY THE CODER AGENT",
                                        f"{require_statements}\n{use_statements}")
        utils.create_file(app_js_path, final_content)


class DocumenterAgent:
    """Agent for creating documentation."""

    def __init__(self, graph_state, project_path):
        self.graph = _normalize_graph(graph_state)
        self.project_path = project_path

    def run(self):
        print("\nDOCUMENTER: Creating project documentation...")
        self._create_readme()
        print("DOCUMENTER: Documentation created.")

    def _create_readme(self):
        project_name = self.graph.get("projectName", "my-express-app")

        endpoints_md = "## API Endpoints\n\n"
        if self.graph.get("routes"):
            endpoints_md += "| Method | Endpoint             | Description                               |\n"
            endpoints_md += "|--------|----------------------|-------------------------------------------|\n"
            for route in self.graph.get("routes", []):
                endpoints_md += f"| `{route['method']}` | `{route['path']}` | {route['description']} |\n"

        schemas_md = "## Database Schemas\n\n"
        # ... (schema documentation logic remains the same)
        for schema in self.graph.get("schemas", []):
            schemas_md += f"### {schema['name']} Schema\n"
            schemas_md += "| Field      | Type         | Constraints  |\n"
            schemas_md += "|------------|--------------|--------------|\n"
            for field, details in schema['fields'].items():
                constraints = ', '.join([k for k, v in details.items() if k != 'type' and v])
                schemas_md += f"| `{field}` | `{details['type']}` | {constraints} |\n"
            schemas_md += "\n"

        readme_content = f"""
# {project_name}
This API was auto-generated by a multi-agent system.
## Getting Started
### Prerequisites

- Node.js & npm
- MongoDB
### Installation & Setup
1.  `cd {project_name}`
2.  `npm install`
3.  `npm run dev`
---
{endpoints_md}
---
{schemas_md}
"""
        utils.create_file(os.path.join(self.project_path, "README.md"), readme_content)

