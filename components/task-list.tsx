"use client"

import type React from "react"

import { useState } from "react"
import {
  Edit2,
  Trash2,
  CheckCircle,
  Circle,
  Copy,
  Filter,
  Clock,
  ChevronDown,
  ChevronUp,
  Timer,
  Repeat,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { TimeTracker } from "@/components/time-tracker"
import type { Task, TaskFilter } from "@/types/task"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface TaskListProps {
  tasks: Task[]
  onDelete: (id: string, parentId?: string) => void
  onEdit: (task: Task) => void
  onToggleComplete: (id: string, parentId?: string) => void
  onDuplicate: (task: Task) => void
  onUpdateStatus: (id: string, status: string, parentId?: string) => void
  onUpdateTime: (id: string, timeSpent: number, parentId?: string) => void
  availableTags?: string[]
  filter: TaskFilter
  setFilter: React.Dispatch<React.SetStateAction<TaskFilter>>
}

export function TaskList({
  tasks,
  onDelete,
  onEdit,
  onToggleComplete,
  onDuplicate,
  onUpdateStatus,
  onUpdateTime,
  availableTags = [],
  filter,
  setFilter,
}: TaskListProps) {
  const [sortBy, setSortBy] = useState<"dueDate" | "priority" | "createdAt" | "timeEstimate">("dueDate")
  const [expandedTasks, setExpandedTasks] = useState<string[]>([])
  const [showTimeTracker, setShowTimeTracker] = useState<string | null>(null)

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTasks((prev) => (prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]))
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    // Always put completed tasks at the bottom
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1
    }

    // Then sort by the selected sort method
    if (sortBy === "dueDate") {
      if (!a.dueDate && !b.dueDate) return 0
      if (!a.dueDate) return 1
      if (!b.dueDate) return -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    }

    if (sortBy === "priority") {
      const priorityValue = { high: 3, medium: 2, low: 1 }
      return (
        (priorityValue[b.priority as keyof typeof priorityValue] || 0) -
        (priorityValue[a.priority as keyof typeof priorityValue] || 0)
      )
    }

    if (sortBy === "timeEstimate") {
      const aEstimate = a.timeEstimate || 0
      const bEstimate = b.timeEstimate || 0
      return aEstimate - bEstimate
    }

    // Default to creation date (newest first)
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "backlog":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
      case "todo":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "in-progress":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      case "review":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
      case "done":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const handleTagToggle = (tag: string) => {
    setFilter((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag) ? prev.tags.filter((t) => t !== tag) : [...prev.tags, tag],
    }))
  }

  const handleStatusToggle = (status: string) => {
    setFilter((prev) => ({
      ...prev,
      status: prev.status.includes(status) ? prev.status.filter((s) => s !== status) : [...prev.status, status],
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

  const formatTime = (minutes?: number) => {
    if (!minutes) return "0m"

    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours === 0) return `${mins}m`
    return `${hours}h ${mins}m`
  }

  const renderTask = (task: Task, isSubtask = false, parentId?: string) => (
    <Card
      key={task.id}
      className={cn("transition-all", task.completed ? "opacity-70" : "", isSubtask ? "ml-6 mt-2" : "")}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 mt-0.5 -ml-1.5"
              onClick={() => onToggleComplete(task.id, parentId)}
            >
              {task.completed ? <CheckCircle className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5" />}
            </Button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className={cn("font-medium text-base", task.completed && "line-through text-muted-foreground")}>
                  {task.title}
                </h3>

                {task.subtasks && task.subtasks.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 p-0"
                    onClick={() => toggleTaskExpansion(task.id)}
                  >
                    {expandedTasks.includes(task.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}

                {task.recurrence && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Repeat className="h-3 w-3" />
                    Recurring
                  </Badge>
                )}
              </div>

              {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}

              <div className="flex flex-wrap gap-2 mt-2">
                {task.dueDate && (
                  <Badge variant="outline" className="text-xs">
                    Due: {format(new Date(task.dueDate), "MMM d, yyyy")}
                  </Badge>
                )}

                {task.status && (
                  <Badge className={cn("text-xs", getStatusColor(task.status))}>
                    {task.status === "in-progress"
                      ? "In Progress"
                      : task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                  </Badge>
                )}

                <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </Badge>

                {(task.timeEstimate || task.timeSpent) && (
                  <Badge variant="outline" className="text-xs gap-1">
                    <Clock className="h-3 w-3" />
                    {task.timeSpent ? formatTime(task.timeSpent) : "0m"}
                    {task.timeEstimate ? `/ ${formatTime(task.timeEstimate)}` : ""}
                  </Badge>
                )}

                {task.tags &&
                  task.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>

          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowTimeTracker(task.id)}
              className="h-8 w-8"
              title="Track time"
            >
              <Timer className="h-4 w-4" />
              <span className="sr-only">Track Time</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDuplicate(task)}>
                  <Copy className="h-4 w-4 mr-2" />
                  Duplicate
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuCheckboxItem
                  checked={task.status === "backlog"}
                  onCheckedChange={() => onUpdateStatus(task.id, "backlog", parentId)}
                >
                  Backlog
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={task.status === "todo"}
                  onCheckedChange={() => onUpdateStatus(task.id, "todo", parentId)}
                >
                  To Do
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={task.status === "in-progress"}
                  onCheckedChange={() => onUpdateStatus(task.id, "in-progress", parentId)}
                >
                  In Progress
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={task.status === "review"}
                  onCheckedChange={() => onUpdateStatus(task.id, "review", parentId)}
                >
                  Review
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={task.status === "done"}
                  onCheckedChange={() => onUpdateStatus(task.id, "done", parentId)}
                >
                  Done
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant="ghost" size="icon" onClick={() => onEdit(task)} className="h-8 w-8">
              <Edit2 className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(task.id, parentId)}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        </div>

        {showTimeTracker === task.id && (
          <div className="mt-4 p-3 border rounded-md">
            <TimeTracker
              onTimeUpdate={(minutes) => {
                onUpdateTime(task.id, minutes, parentId)
                setShowTimeTracker(null)
              }}
              onCancel={() => setShowTimeTracker(null)}
            />
          </div>
        )}

        {task.subtasks && task.subtasks.length > 0 && expandedTasks.includes(task.id) && (
          <div className="mt-4 space-y-2">{task.subtasks.map((subtask) => renderTask(subtask, true, task.id))}</div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter.showCompleted ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter((prev) => ({ ...prev, showCompleted: !prev.showCompleted }))}
          >
            {filter.showCompleted ? "Hide Completed" : "Show Completed"}
          </Button>

          <Button
            variant={filter.showSubtasks ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter((prev) => ({ ...prev, showSubtasks: !prev.showSubtasks }))}
          >
            {filter.showSubtasks ? "Hide Subtasks" : "Show Subtasks"}
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
                Status
                {filter.status.length > 0 && (
                  <Badge variant="secondary" className="ml-1 px-1">
                    {filter.status.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={filter.status.includes("backlog")}
                onCheckedChange={() => handleStatusToggle("backlog")}
              >
                Backlog
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.status.includes("todo")}
                onCheckedChange={() => handleStatusToggle("todo")}
              >
                To Do
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.status.includes("in-progress")}
                onCheckedChange={() => handleStatusToggle("in-progress")}
              >
                In Progress
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.status.includes("review")}
                onCheckedChange={() => handleStatusToggle("review")}
              >
                Review
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={filter.status.includes("done")}
                onCheckedChange={() => handleStatusToggle("done")}
              >
                Done
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort:{" "}
                {sortBy === "dueDate"
                  ? "Due Date"
                  : sortBy === "priority"
                    ? "Priority"
                    : sortBy === "timeEstimate"
                      ? "Time Estimate"
                      : "Created"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem checked={sortBy === "dueDate"} onCheckedChange={() => setSortBy("dueDate")}>
                Due Date
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={sortBy === "priority"} onCheckedChange={() => setSortBy("priority")}>
                Priority
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={sortBy === "timeEstimate"}
                onCheckedChange={() => setSortBy("timeEstimate")}
              >
                Time Estimate
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem checked={sortBy === "createdAt"} onCheckedChange={() => setSortBy("createdAt")}>
                Created Date
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {sortedTasks.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No tasks match your current filters. Try adjusting your filters or add a new task.
        </div>
      ) : (
        <div className="space-y-3">{sortedTasks.map((task) => renderTask(task))}</div>
      )}
    </div>
  )
}
