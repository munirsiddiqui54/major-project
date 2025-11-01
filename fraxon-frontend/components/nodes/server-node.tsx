import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Server } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const ServerNode = memo(({ data, isConnectable }: NodeProps) => {
  const { label, config } = data

  return (
    <Card className="w-64 bg-background border-primary/50 shadow-md">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          {label}
          <Badge variant="outline" className="ml-auto text-xs">
            {config.port ? `Port: ${config.port}` : "Server"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {config.host && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Host:</span>
            <span>{config.host}</span>
          </div>
        )}
        {config.port && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Port:</span>
            <span>{config.port}</span>
          </div>
        )}
      </CardContent>
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3 bg-primary border-background"
        isConnectable={isConnectable}
      />
    </Card>
  )
})

ServerNode.displayName = "ServerNode"

