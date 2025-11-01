let latestGraphState: any = null
let latestRawGraph: { nodes: any[]; edges: any[] } | null = null
let applyGraphCallback: ((data: { nodes: any[]; edges: any[] }) => void) | null = null

export function setGraphState(state: any) {
    latestGraphState = state
}

export function getGraphState() {
    return latestGraphState
}

export function setRawGraph(data: { nodes: any[]; edges: any[] }) {
    latestRawGraph = data
}

export function getRawGraph() {
    return latestRawGraph
}

export function registerApplyGraph(cb: (data: { nodes: any[]; edges: any[] }) => void) {
    applyGraphCallback = cb
}

export function applyGraph(data: { nodes: any[]; edges: any[] }) {
    if (applyGraphCallback) applyGraphCallback(data)
}


