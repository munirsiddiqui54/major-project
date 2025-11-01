import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Filter } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const MiddlewareNode = memo(({ data, isConnectable }: NodeProps) => {
  const { label, config } = data

  return (
    <Card className="w-64 bg-background border-amber-500/50 shadow-md">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Filter className="h-4 w-4 text-amber-500" />
          {label}
          <Badge variant="outline" className="ml-auto text-xs bg-amber-950 text-amber-300 border-amber-800">
            Middleware
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-xs">
        {config.name && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Name:</span>
            <span>{config.name}</span>
          </div>
        )}
        {config.type && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Type:</span>
            <span>{config.type}</span>
          </div>
        )}
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3 bg-amber-500 border-background"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3 bg-amber-500 border-background"
        isConnectable={isConnectable}
      />
    </Card>
  )
})

MiddlewareNode.displayName = "MiddlewareNode"

