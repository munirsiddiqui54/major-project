"use client"

import type React from "react"
import { Server, Route, Cpu, Filter, Database, FileJson, Webhook, Lock, Mail, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ComponentItemProps {
  icon: React.ReactNode
  label: string
  type: string
  color: string
}

export function ComponentsPanel() {
  return (
    <Card className="w-64 h-full bg-background border-r border-border rounded-none">
      <CardHeader className="p-4 border-b">
        <CardTitle className="text-lg">Components</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-64px)]">
          <Accordion type="multiple" defaultValue={["core", "data", "auth"]}>
            <AccordionItem value="core">
              <AccordionTrigger className="px-4 py-2">Core Components</AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className="space-y-1">
                  <ComponentItem
                    icon={<Server className="h-4 w-4" />}
                    label="Server"
                    type="server"
                    color="text-primary"
                  />
                  <ComponentItem
                    icon={<Route className="h-4 w-4" />}
                    label="Route"
                    type="route"
                    color="text-emerald-500"
                  />
                  <ComponentItem
                    icon={<Cpu className="h-4 w-4" />}
                    label="Controller"
                    type="controller"
                    color="text-purple-500"
                  />
                  <ComponentItem
                    icon={<Filter className="h-4 w-4" />}
                    label="Middleware"
                    type="middleware"
                    color="text-amber-500"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="data">
              <AccordionTrigger className="px-4 py-2">Data Components</AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className="space-y-1">
                  <ComponentItem
                    icon={<Database className="h-4 w-4" />}
                    label="Database"
                    type="database"
                    color="text-blue-500"
                  />
                  <ComponentItem
                    icon={<FileJson className="h-4 w-4" />}
                    label="Model"
                    type="model"
                    color="text-green-500"
                  />
                  <ComponentItem
                    icon={<Search className="h-4 w-4" />}
                    label="Query"
                    type="query"
                    color="text-indigo-500"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="auth">
              <AccordionTrigger className="px-4 py-2">Authentication</AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className="space-y-1">
                  <ComponentItem
                    icon={<Lock className="h-4 w-4" />}
                    label="Auth Provider"
                    type="auth-provider"
                    color="text-red-500"
                  />
                  <ComponentItem
                    icon={<Webhook className="h-4 w-4" />}
                    label="OAuth"
                    type="oauth"
                    color="text-orange-500"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="integrations">
              <AccordionTrigger className="px-4 py-2">Integrations</AccordionTrigger>
              <AccordionContent className="pt-1 pb-2">
                <div className="space-y-1">
                  <ComponentItem
                    icon={<Mail className="h-4 w-4" />}
                    label="Email Service"
                    type="email-service"
                    color="text-sky-500"
                  />
                  <ComponentItem
                    icon={<Webhook className="h-4 w-4" />}
                    label="Webhook"
                    type="webhook"
                    color="text-pink-500"
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

function ComponentItem({ icon, label, type, color }: ComponentItemProps) {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType)
    event.dataTransfer.effectAllowed = "move"
  }

  return (
    <div
      className="flex items-center gap-2 px-4 py-2 hover:bg-muted/50 cursor-grab rounded-sm"
      draggable
      onDragStart={(event) => onDragStart(event, type)}
    >
      <div className={`${color}`}>{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  )
}

