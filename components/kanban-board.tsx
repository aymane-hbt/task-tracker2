"use client"

import type React from "react"
import { Filter } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { Task, TaskFilter } from "@/types/task"
import { cn } from "@/lib/utils"

interface KanbanBoardProps {
  tasks: Task[]
  onDelete: (id: string, parentId?: string) => void
  onEdit: (task: Task) => void
  onToggleComplete: (id: string, parentId?: string) => void
  onUpdateStatus: (id: string, status: string, parentId?: string) => void
  filter: TaskFilter
  setFilter: React.Dispatch<React.SetStateAction<TaskFilter>>
}

export function KanbanBoard({
  tasks,
  onDelete,
  onEdit,
  onToggleComplete,
  onUpdateStatus,
  filter,
  setFilter,
}: KanbanBoardProps) {
  const columns = [
    { id: "backlog", title: "Backlog" },
    { id: "todo", title: "To Do" },
    { id: "in-progress", title: "In Progress" },
    { id: "review", title: "Review" },
    { id: "done", title: "Done" },
  ]

  const handleTagToggle = (tag: string) => {
    setFilter((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handlePriorityToggle = (priority: string) => {
    setFilter((prev) => ({
      ...prev,
      priority: prev.priority.includes(priority)
        ? prev.priority.filter((p) => p !== priority)
        : [...prev.priority, priority],
    }))
  }

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

  // Get all available tags from tasks
  const availableTags = Array.from(new Set(tasks.flatMap((task) => task.tags || [])))

  // Function to handle drag start
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId)
  }

  // Function to handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Function to handle drop
  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault()
    const taskId = e.dataTransfer.getData("taskId")
    onUpdateStatus(taskId, columnId)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter.showCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter((prev) => ({ ...prev, showCompleted: !prev.showCompleted }))}
          >
            {filter.showCompleted ? "Hide Completed" : "Show Completed"}
          </Button>
        </div>

        <div className="flex gap-2">
          {availableTags.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Filter className="h-4 w-4" />
                  Tags
                  {filter.tags.length > 0 && (
                    <Badge variant="secondary" className="ml-1 px-1">
                      {filter.tags.length}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableTags.map((tag) => (
                  <DropdownMenuCheckboxItem
                    key={tag}
                    checked={filter.tags.includes(tag)}
                    onCheckedChange={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1">
                <Filter className="h-4 w-4" />
                Priority
                {filter.priority.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1">
                    {filter.priority.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filter.priority.includes("high")}
                onCheckedChange={() => handlePriorityToggle("high")}
              >
                High
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.priority.includes("medium")}
                onCheckedChange={() => handlePriorityToggle("medium")}
              >
                Medium
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.priority.includes("low")}
                onCheckedChange={() => handlePriorityToggle("low")}
              >
                Low
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex flex-col h-full"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <Card className="h-full flex flex-col">
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {column.title}
                  <Badge variant="secondary" className="ml-2">
                    {tasks.filter((task) => task.status === column.id).length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-2">
                <div className="space-y-2">
                  {tasks
                    .filter((task) => task.status === column.id)
                    .map((task) => (
                      <div
                        key={task.id}
                        className="bg-card border rounded-md p-3 shadow-sm cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => onEdit(task)}
                      >
                        <div className="space-y-2">
                          <div className="font-medium text-sm">{task.title}</div>

                          <div className="flex flex-wrap gap-1">
                            <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                            </Badge>

                            {task.tags &&
                              task.tags.map((tag) => (
                                <Badge key={tag} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
