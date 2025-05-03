"use client"

import { useState } from "react"
import { Copy, Trash2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import type { Task } from "@/types/task"
import { cn } from "@/lib/utils"

interface TaskTemplatesProps {
  templates: Task[]
  onUseTemplate: (template: Task) => void
  onDeleteTemplate: (id: string) => void
  onClose: () => void
}

export function TaskTemplates({ templates, onUseTemplate, onDeleteTemplate, onClose }: TaskTemplatesProps) {
  const [searchQuery, setSearchQuery] = useState("")

  const filteredTemplates = templates.filter((template) => {
    if (!searchQuery) return true

    const query = searchQuery.toLowerCase()
    return (
      template.title.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query)) ||
      (template.tags && template.tags.some((tag) => tag.toLowerCase().includes(query)))
    )
  })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400"
      case "medium":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "low":
        return "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <CardTitle className="text-xl">Task Templates</CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Input placeholder="Search templates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />

      {filteredTemplates.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          {templates.length === 0
            ? "No templates yet. Save a task as a template to get started."
            : "No templates match your search."}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{template.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {template.description && (
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={cn("text-xs", getPriorityColor(template.priority))}>
                    {template.priority.charAt(0).toUpperCase() + template.priority.slice(1)}
                  </Badge>

                  {template.tags &&
                    template.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}

                  {template.recurrence && (
                    <Badge variant="outline" className="text-xs">
                      Recurring
                    </Badge>
                  )}

                  {template.subtasks && template.subtasks.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {template.subtasks.length} subtasks
                    </Badge>
                  )}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" size="sm" className="gap-1" onClick={() => onUseTemplate(template)}>
                    <Copy className="h-4 w-4" />
                    Use Template
                  </Button>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
