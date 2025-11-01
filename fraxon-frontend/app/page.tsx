"use client";

import type React from "react";

import { useState, useCallback, useRef, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type NodeTypes,
  ReactFlowProvider,
  type NodeMouseHandler,
} from "reactflow";
import "reactflow/dist/style.css";
import { type NodeData, initialNodes, initialEdges } from "@/lib/initial-data";
import { ServerNode } from "@/components/nodes/server-node";
import { RouteNode } from "@/components/nodes/route-node";
import { ControllerNode } from "@/components/nodes/controller-node";
import { MiddlewareNode } from "@/components/nodes/middleware-node";
import { ConfigPanel } from "@/components/config-panel";
import { ComponentsPanel } from "@/components/components-panel";
import { Navbar } from "@/components/navbar";
import { setGraphState, setRawGraph, registerApplyGraph } from "@/lib/graph-store";

// State representation interface
interface CanvasState {
  timestamp: string;
  nodes: {
    id: string;
    type: string;
    position: { x: number; y: number };
    label: string;
    config: any;
  }[];
  edges: {
    id: string;
    source: string;
    target: string;
    type?: string;
  }[];
  connections: {
    [nodeType: string]: string[];
  };
  nodeCount: {
    server: number;
    route: number;
    controller: number;
    middleware: number;
    total: number;
  };
  edgeCount: number;
}

// Function to create state representation
const createStateRepresentation = (nodes: any[], edges: any[]): CanvasState => {
  const nodeCount = {
    server: 0,
    route: 0,
    controller: 0,
    middleware: 0,
    total: nodes.length,
  };

  const connections: { [nodeType: string]: string[] } = {};

  const processedNodes = nodes.map(node => {
    // Count nodes by type
    if (nodeCount.hasOwnProperty(node.type)) {
      nodeCount[node.type as keyof typeof nodeCount]++;
    }

    // Initialize connections for this node
    connections[node.id] = [];

    return {
      id: node.id,
      type: node.type,
      position: {
        x: Math.round(node.position.x),
        y: Math.round(node.position.y)
      },
      label: node.data?.label || node.type,
      config: node.data?.config || {}
    };
  });

  const processedEdges = edges.map(edge => {
    // Build connection map
    if (connections[edge.source]) {
      connections[edge.source].push(edge.target);
    }

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type
    };
  });

  return {
    timestamp: new Date().toISOString(),
    nodes: processedNodes,
    edges: processedEdges,
    connections,
    nodeCount,
    edgeCount: edges.length
  };
};

// Function to log state changes as JSON
const logStateChange = (state: CanvasState, changeType: string) => {
  console.log(`🔄 Canvas State Change: ${changeType}`);
  console.log(JSON.stringify(state, null, 2));
};

export default function Home() {
  // Add this useEffect to handle the ResizeObserver error
  useEffect(() => {
    // This is a workaround for the ResizeObserver loop error
    const handleError = (event: ErrorEvent) => {
      if (
        event.message ===
          "ResizeObserver loop completed with undelivered notifications." ||
        event.message === "ResizeObserver loop limit exceeded"
      ) {
        // Prevent the error from appearing in the console
        event.stopImmediatePropagation();
      }
    };

    window.addEventListener("error", handleError as EventListener);

    return () => {
      window.removeEventListener("error", handleError as EventListener);
    };
  }, []);

  return (
    <div className="w-full h-screen bg-black">
      <ReactFlowProvider>
        <Navbar />
        <Canvas />
      </ReactFlowProvider>
    </div>
  );
}

const nodeTypes: NodeTypes = {
  server: ServerNode,
  route: RouteNode,
  controller: ControllerNode,
  middleware: MiddlewareNode,
};

function Canvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Track previous state for comparison
  const prevStateRef = useRef<CanvasState | null>(null);

  // Effect to log state changes whenever nodes or edges change
  useEffect(() => {
    const currentState = createStateRepresentation(nodes, edges);
    
    // Skip logging on initial load if nodes are empty
    if (nodes.length === 0 && edges.length === 0 && !prevStateRef.current) {
      return;
    }

    // Determine change type
    let changeType = "Update";
    if (!prevStateRef.current) {
      changeType = "Initial Load";
    } else {
      const prevState = prevStateRef.current;
      if (currentState.nodeCount.total > prevState.nodeCount.total) {
        changeType = "Node Added";
      } else if (currentState.nodeCount.total < prevState.nodeCount.total) {
        changeType = "Node Removed";
      } else if (currentState.edgeCount > prevState.edgeCount) {
        changeType = "Edge Added";
      } else if (currentState.edgeCount < prevState.edgeCount) {
        changeType = "Edge Removed";
      } else {
        changeType = "Node/Edge Modified";
      }
    }

    logStateChange(currentState, changeType);
    prevStateRef.current = currentState;
    setGraphState(currentState);
    setRawGraph({ nodes, edges });
  }, [nodes, edges]);

  const debounce = (fn: Function, ms = 300) => {
    let timeoutId: ReturnType<typeof setTimeout>;
    return function (this: any, ...args: any[]) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(this, args), ms);
    };
  };

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick: NodeMouseHandler = useCallback((_, node) => {
    setSelectedNode(node.data);
  }, []);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");

      if (typeof type === "undefined" || !type) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
          config: {},
          id: `${type}-${Date.now()}`,
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  useEffect(() => {
    const handleResize = debounce(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ padding: 0.2 });
      }
    }, 200);

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [reactFlowInstance]);

  // Allow external import to apply a saved graph
  useEffect(() => {
    registerApplyGraph(({ nodes: n, edges: e }) => {
      setNodes(n as any);
      setEdges(e as any);
      // fit after a tick
      setTimeout(() => {
        reactFlowInstance?.fitView?.({ padding: 0.2 });
      }, 50);
    });
  }, [reactFlowInstance, setNodes, setEdges]);

  const onAddNode = (type: string) => {
    const position = {
      x: Math.random() * 400,
      y: Math.random() * 400,
    };

    const newNode = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      data: {
        label: `${type.charAt(0).toUpperCase() + type.slice(1)}`,
        config: {},
        id: `${type}-${Date.now()}`,
      },
    };

    setNodes((nds) => nds.concat(newNode));
  };

  const updateNodeConfig = (nodeId: string, config: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              config,
            },
          };
        }
        return node;
      })
    );
  };

  return (
    <div className="w-full h-[90vh] flex">
      <ComponentsPanel />

      <div className="flex-1 h-full" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          onInit={(instance) => {
            setReactFlowInstance(instance);

            // Add a small delay before fitting the view to avoid resize issues
            setTimeout(() => {
              instance.fitView({ padding: 0.2 });
            }, 100);
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
          className="bg-black"
        >
          <Controls className="bg-background border border-border" />
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            className="bg-background/80 border border-border rounded-md"
          />
          <Background color="#333" gap={16} />
        </ReactFlow>
      </div>

      {selectedNode && (
        <ConfigPanel
          node={selectedNode}
          onUpdate={(config) => updateNodeConfig(selectedNode.id, config)}
          onClose={() => setSelectedNode(null)}
        />
      )}
    </div>
  );
}