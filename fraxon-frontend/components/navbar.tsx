import { Button } from "@/components/ui/button";
import { Download, Play, Save, Rocket } from "lucide-react";
import { getGraphState } from "@/lib/graph-store";
import { BACKEND_URL } from "@/lib/config";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { buildGraphState } from "@/lib/transform";
import { getRawGraph, applyGraph } from "@/lib/graph-store";

export function Navbar() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [importing, setImporting] = useState(false);
  let fileInputRef: HTMLInputElement | null = null;

  const handleGenerate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const state = getGraphState();
      if (!state) {
        toast({ title: "No graph state", description: "Make some changes on the canvas first." });
        console.warn("Generate attempted with no graph state");
        return;
      }
      if (!Array.isArray(state.nodes) || !Array.isArray(state.edges)) {
        toast({ title: "Invalid graph", description: "State must include nodes and edges arrays." });
        console.error("Invalid state shape", state);
        return;
      }

      let graphState: any
      try {
        graphState = buildGraphState(state as any)
      } catch (e: any) {
        toast({ title: "Graph build failed", description: e?.message || "Invalid canvas state" })
        console.error("buildGraphState error", e)
        return
      }

      const res = await fetch(`${BACKEND_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ graphState }),
      });

      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch { /* ignore */ }

      if (!res.ok) {
        toast({ title: "Generation failed", description: data?.message || text || `HTTP ${res.status}` });
        console.error("/api/generate error", { status: res.status, data: data || text });
        return;
      }

      toast({ title: "Generation complete", description: data?.projectPath || "Backend generated" });
      console.log("/api/generate success", data || text);
    } catch (err: any) {
      toast({ title: "Network error", description: err?.message || "Unable to reach backend" });
      console.error("/api/generate exception", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    const raw = getRawGraph();
    if (!raw || !Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) {
      toast({ title: "Nothing to save", description: "Create or modify the canvas first." });
      return;
    }
    const blob = new Blob([JSON.stringify(raw, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fraxon-graph-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: "Saved", description: "Graph exported as JSON" });
  };

  const triggerImport = () => {
    if (importing) return;
    setImporting(true);
    if (!fileInputRef) {
      fileInputRef = document.createElement("input");
      fileInputRef.type = "file";
      fileInputRef.accept = "application/json";
      fileInputRef.style.display = "none";
      fileInputRef.onchange = async (e: any) => {
        try {
          const file = e.target?.files?.[0];
          if (!file) return;
          const text = await file.text();
          const data = JSON.parse(text);
          if (!Array.isArray(data?.nodes) || !Array.isArray(data?.edges)) {
            toast({ title: "Invalid file", description: "JSON must include nodes and edges arrays" });
            return;
          }
          applyGraph({ nodes: data.nodes, edges: data.edges });
          toast({ title: "Imported", description: "Graph loaded from JSON" });
        } catch (err: any) {
          toast({ title: "Import failed", description: err?.message || "Could not read file" });
          console.error("Import error", err);
        } finally {
          setImporting(false);
          if (fileInputRef) fileInputRef.value = "";
        }
      };
      document.body.appendChild(fileInputRef);
    }
    fileInputRef.click();
  };

  const handleDeploy = async () => {
    if (deploying) return;
    setDeploying(true);
    try {
      const payload = process.env.NEXT_PUBLIC_PROJECT_NAME
        ? { projectName: process.env.NEXT_PUBLIC_PROJECT_NAME }
        : {};

      const res = await fetch(`${BACKEND_URL}/api/deploy/render`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let data: any = null;
      try { data = JSON.parse(text); } catch {}

      if (!res.ok) {
        toast({ title: "Deploy failed", description: data?.message || text || `HTTP ${res.status}` });
        console.error("/api/deploy/render error", { status: res.status, data: data || text });
        return;
      }

      toast({ title: "Deploy triggered", description: data?.render?.body?.service?.name || data?.render?.body?.name || "Render service created/updated" });
      console.log("/api/deploy/render success", data || text);
    } catch (err: any) {
      toast({ title: "Network error", description: err?.message || "Unable to reach backend" });
      console.error("/api/deploy/render exception", err);
    } finally {
      setDeploying(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-black border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Fraxon Logo" className="h-8 w-8" />
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Fraxon
          </h1>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            No-Code Backend Platform
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          className="gap-1 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white"
          onClick={handleGenerate}
          disabled={loading}
        >
          <Rocket className="h-4 w-4" />
          {loading ? "Generating..." : "Generate"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
          onClick={handleSave}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1 dark:border-gray-600 dark:text-white dark:hover:bg-gray-800"
          onClick={triggerImport}
          disabled={importing}
        >
          <Download className="h-4 w-4" />
          Import
        </Button>
        <Button
          size="sm"
          className="gap-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
          onClick={handleDeploy}
          disabled={deploying}
        >
          <Play className="h-4 w-4" />
          {deploying ? "Deploying..." : "Deploy"}
        </Button>
      </div>
    </div>
  );
}
