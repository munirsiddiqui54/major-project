"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ConfigPanelProps {
  node: any
  onUpdate: (config: any) => void
  onClose: () => void
}

export function ConfigPanel({ node, onUpdate, onClose }: ConfigPanelProps) {
  const [config, setConfig] = useState<any>(node.config || {})
  const nodeType = node.id.split("-")[0]

  useEffect(() => {
    setConfig(node.config || {})

    // Return a cleanup function to prevent memory leaks
    return () => {
      // This helps ensure any pending resize observations are completed
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          // This empty callback ensures we've gone through two animation frames
        })
      })
    }
  }, [node])

  const handleChange = (key: string, value: string) => {
    const newConfig = { ...config, [key]: value }
    setConfig(newConfig)
    onUpdate(newConfig)
  }

  const renderServerConfig = () => (
    <>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="host">Host</Label>
        <Input
          id="host"
          placeholder="localhost"
          value={config.host || ""}
          onChange={(e) => handleChange("host", e.target.value)}
        />
      </div>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="port">Port</Label>
        <Input
          id="port"
          placeholder="3000"
          value={config.port || ""}
          onChange={(e) => handleChange("port", e.target.value)}
        />
      </div>
    </>
  )

  const renderRouteConfig = () => (
    <>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="path">Path</Label>
        <Input
          id="path"
          placeholder="/api/users"
          value={config.path || ""}
          onChange={(e) => handleChange("path", e.target.value)}
        />
      </div>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="method">Method</Label>
        <Select value={config.method || "GET"} onValueChange={(value) => handleChange("method", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )

  const renderControllerConfig = () => (
    <>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="name">Controller Name</Label>
        <Input
          id="name"
          placeholder="UserController"
          value={config.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="actions">Actions</Label>
        <Textarea
          id="actions"
          placeholder="getUsers, createUser, updateUser"
          value={config.actions || ""}
          onChange={(e) => handleChange("actions", e.target.value)}
          className="min-h-[100px]"
        />
      </div>
    </>
  )

  const renderMiddlewareConfig = () => (
    <>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="name">Middleware Name</Label>
        <Input
          id="name"
          placeholder="Authentication"
          value={config.name || ""}
          onChange={(e) => handleChange("name", e.target.value)}
        />
      </div>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="type">Type</Label>
        <Select value={config.type || ""} onValueChange={(value) => handleChange("type", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auth">Authentication</SelectItem>
            <SelectItem value="validation">Validation</SelectItem>
            <SelectItem value="logging">Logging</SelectItem>
            <SelectItem value="error">Error Handling</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  )

  const renderDatabaseConfig = () => (
    <>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="dbName">Database Name</Label>
        <Input
          id="dbName"
          placeholder="my_database"
          value={config.dbName || ""}
          onChange={(e) => handleChange("dbName", e.target.value)}
        />
      </div>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="dbType">Database Type</Label>
        <Select value={config.dbType || "postgres"} onValueChange={(value) => handleChange("dbType", value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select database type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="postgres">PostgreSQL</SelectItem>
            <SelectItem value="mysql">MySQL</SelectItem>
            <SelectItem value="mongodb">MongoDB</SelectItem>
            <SelectItem value="sqlite">SQLite</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="connectionString">Connection String</Label>
        <Input
          id="connectionString"
          placeholder="postgres://user:password@localhost:5432/db"
          value={config.connectionString || ""}
          onChange={(e) => handleChange("connectionString", e.target.value)}
        />
      </div>
    </>
  )

  const renderModelConfig = () => (
    <>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="modelName">Model Name</Label>
        <Input
          id="modelName"
          placeholder="User"
          value={config.modelName || ""}
          onChange={(e) => handleChange("modelName", e.target.value)}
        />
      </div>
      <div className="grid w-full items-center gap-2">
        <Label htmlFor="schema">Schema Definition</Label>
        <Textarea
          id="schema"
          placeholder="id: string\nname: string\nemail: string"
          value={config.schema || ""}
          onChange={(e) => handleChange("schema", e.target.value)}
          className="min-h-[150px] font-mono text-xs"
        />
      </div>
    </>
  )

  const renderConfigFields = () => {
    switch (nodeType) {
      case "server":
        return renderServerConfig()
      case "route":
        return renderRouteConfig()
      case "controller":
        return renderControllerConfig()
      case "middleware":
        return renderMiddlewareConfig()
      case "database":
        return renderDatabaseConfig()
      case "model":
        return renderModelConfig()
      default:
        return (
          <div className="py-4 text-center text-muted-foreground">
            Configuration options for this component type will be available soon.
          </div>
        )
    }
  }

  return (
    <Card className="w-80 h-full bg-background border-l border-border rounded-none">
      <CardHeader className="p-4 flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Configure {nodeType}</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <ScrollArea className="h-[calc(100vh-64px)]">
        <CardContent className="p-4 space-y-4">{renderConfigFields()}</CardContent>
      </ScrollArea>
    </Card>
  )
}

