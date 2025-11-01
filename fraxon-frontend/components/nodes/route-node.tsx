import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Route } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const RouteNode = memo(({ data, isConnectable }: NodeProps) => {
  const { label, config } = data

  return (
    <Card className="w-64 bg-background border-emerald-500/50 shadow-md">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Route className="h-4 w-4 text-emerald-500" />
          {label}
          <Badge variant="outline" className="ml-auto text-xs bg-emerald-950 text-emerald-300 border-emerald-800">
            {config.method || "GET"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {config.path && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Path:</span>
            <span>{config.path}</span>
          </div>
        )}
        {config.method && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Method:</span>
            <span>{config.method}</span>
          </div>
        )}
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3 bg-emerald-500 border-background"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3 bg-emerald-500 border-background"
        isConnectable={isConnectable}
      />
    </Card>
  )
})

RouteNode.displayName = "RouteNode"

