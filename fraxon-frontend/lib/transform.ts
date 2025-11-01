type CanvasNode = {
    id: string
    type: string
    label: string
    position: { x: number; y: number }
    config: any
}

type CanvasState = {
    timestamp: string
    nodes: CanvasNode[]
    edges: { id: string; source: string; target: string; type?: string }[]
    connections: { [id: string]: string[] }
    nodeCount: any
    edgeCount: number
}

export function buildGraphState(state: CanvasState) {
    if (!state || !Array.isArray(state.nodes)) throw new Error("Invalid canvas state")

    const idToNode: Record<string, CanvasNode> = {}
    state.nodes.forEach((n) => (idToNode[n.id] = n))

    const getFirstConnected = (id: string, type?: string) => {
        const next = state.connections?.[id] || []
        if (!type) return next[0] && idToNode[next[0]]
        for (const nid of next) {
            const nn = idToNode[nid]
            if (nn?.type === type) return nn
        }
        return undefined
    }

    // projectName
    const server = state.nodes.find((n) => n.type === "server")
    const projectName = server?.config?.projectName || "generated-api"

    // schemas from model nodes
    const schemas = state.nodes
        .filter((n) => n.type === "model")
        .map((n) => {
            const name = n.config?.modelName || n.label || "Model"
            const raw = String(n.config?.schema || "").trim()
            const fields: Record<string, any> = {}
            if (raw) {
                raw.split(/\r?\n/).forEach((line) => {
                    const s = line.trim()
                    if (!s) return
                    const [key, typePart] = s.split(":").map((p) => p.trim())
                    if (!key || !typePart) return
                    // Normalize type casing
                    const typeNorm = typePart.replace(/\bstring\b/i, "String").replace(/\bnumber\b/i, "Number").replace(/\bboolean\b/i, "Boolean")
                    fields[key] = { type: typeNorm || "String", required: true }
                })
            }
            // Minimal hook support for known cases
            const hooks: any = {}
            if (name === "User") {
                hooks["pre-save"] = "Hash the password using bcrypt before saving the user."
            }
            return Object.keys(hooks).length ? { name, fields, hooks } : { name, fields }
        })

    // controllers
    const controllers = state.nodes
        .filter((n) => n.type === "controller")
        .map((n) => {
            const name = n.config?.name || n.label || "Controller"
            const modelNode = getFirstConnected(n.id, "model")
            const schemaName = modelNode?.config?.modelName || modelNode?.label || schemas[0]?.name || "User"
            // Default simplistic logic if none provided
            const actions = String(n.config?.actions || "").split(",").map((s) => s.trim()).filter(Boolean)
            const generated = actions.length
                ? actions.map((a) => ({ name: a, schema: schemaName, logic: `Implement ${a} using ${schemaName} model.` }))
                : [
                    {
                        name: "getAll" + schemaName + "s",
                        schema: schemaName,
                        logic: "Retrieve all records.",
                    },
                ]
            return generated
        })
        .flat()

    // routes
    const routes = state.nodes
        .filter((n) => n.type === "route")
        .map((n) => {
            const path = n.config?.path || "/api/resource"
            const method = (n.config?.method || "GET").toUpperCase()
            const ctrlNode = getFirstConnected(n.id, "controller") || getFirstConnected(n.id)
            const controllerName = ctrlNode?.config?.name || controllers[0]?.name || "getAll"
            // Try to infer schema via controller -> model
            let schemaName = schemas[0]?.name || "User"
            const modelViaCtrl = ctrlNode && getFirstConnected(ctrlNode.id, "model")
            if (modelViaCtrl) schemaName = modelViaCtrl.config?.modelName || modelViaCtrl.label || schemaName
            return {
                path,
                method,
                schema: schemaName,
                controller: controllerName,
                description: n.label || `${method} ${path}`,
            }
        })

    // Ensure canonical User controllers exist when users routes are present
    const hasUsersRoutes = routes.some((r) => r.path.startsWith("/api/users"))
    if (hasUsersRoutes) {
        const ensure = (
            name: string,
            logic: string,
            schema = "User",
        ) => {
            if (!controllers.find((c) => c.name === name)) {
                controllers.push({ name, schema, logic })
            }
        }
        ensure(
            "createUserController",
            "Create a new User from req.body. If the email or username already exists, respond with a status code of 409 and a JSON message: { 'message': 'User already exists.' }. On successful creation, respond with a status of 201 and the new user object, but exclude the password field from the response.",
        )
        ensure(
            "getAllUsersController",
            "Retrieve all users from the database. Exclude the password field from the response for all users.",
        )
        ensure(
            "getUserByIdController",
            "Retrieve a single user by their ID from req.params.id. If not found, return a 404 error. Exclude the password field from the response.",
        )
    }

    return {
        projectName,
        schemas,
        controllers,
        routes,
    }
}


