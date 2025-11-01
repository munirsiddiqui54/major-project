import { memo } from "react"
import { Handle, Position, type NodeProps } from "reactflow"
import { Cpu } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const ControllerNode = memo(({ data, isConnectable }: NodeProps) => {
  const { label, config } = data

  return (
    <Card className="w-64 bg-background border-purple-500/50 shadow-md">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Cpu className="h-4 w-4 text-purple-500" />
          {label}
          <Badge variant="outline" className="ml-auto text-xs bg-purple-950 text-purple-300 border-purple-800">
            Controller
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
        {config.actions && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Actions:</span>
            <span>{config.actions}</span>
          </div>
        )}
      </CardContent>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="w-3 h-3 bg-purple-500 border-background"
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="w-3 h-3 bg-purple-500 border-background"
        isConnectable={isConnectable}
      />
    </Card>
  )
})

ControllerNode.displayName = "ControllerNode"

