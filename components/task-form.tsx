"use client"

import type React from "react"

import { useState } from "react"
import { CalendarIcon, X, Plus, Save, Repeat, ChevronDown } from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import type { Task } from "@/types/task"

interface TaskFormProps {
  task?: Task
  onSubmit: (task: Task) => void
  onCancel: () => void
  availableTags?: string[]
  parentTask?: Task
  onSaveTemplate?: (task: Task) => void
}

export function TaskForm({ task, onSubmit, onCancel, availableTags = [], parentTask, onSaveTemplate }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || "")
  const [description, setDescription] = useState(task?.description || "")
  const [dueDate, setDueDate] = useState<Date | undefined>(task?.dueDate ? new Date(task.dueDate) : undefined)
  const [priority, setPriority] = useState(task?.priority || "medium")
  const [tags, setTags] = useState<string[]>(task?.tags || [])
  const [newTag, setNewTag] = useState("")
  const [status, setStatus] = useState(task?.status || "todo")
  const [timeEstimate, setTimeEstimate] = useState(task?.timeEstimate?.toString() || "")
  const [showRecurrence, setShowRecurrence] = useState(!!task?.recurrence)
  const [recurrenceFrequency, setRecurrenceFrequency] = useState(task?.recurrence?.frequency || "daily")
  const [recurrenceInterval, setRecurrenceInterval] = useState(task?.recurrence?.interval?.toString() || "1")
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(
    task?.recurrence?.endDate ? new Date(task.recurrence.endDate) : undefined,
  )
  const [selectedDays, setSelectedDays] = useState<number[]>(task?.recurrence?.daysOfWeek || [])
  const [dayOfMonth, setDayOfMonth] = useState(task?.recurrence?.dayOfMonth?.toString() || "1")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [subtasks, setSubtasks] = useState<Task[]>(task?.subtasks || [])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim()) return

    const taskData: Task = {
      id: task?.id || "",
      title,
      description,
      dueDate: dueDate?.toISOString(),
      priority,
      tags,
      completed: task?.completed || false,
      createdAt: task?.createdAt || new Date().toISOString(),
      status,
      timeEstimate: timeEstimate ? Number.parseInt(timeEstimate) : undefined,
      timeSpent: task?.timeSpent || 0,
      parentId: parentTask?.id,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    }

    // Add recurrence data if enabled
    if (showRecurrence && dueDate) {
      taskData.recurrence = {
        frequency: recurrenceFrequency as any,
        interval: Number.parseInt(recurrenceInterval) || 1,
      }

      if (recurrenceEndDate) {
        taskData.recurrence.endDate = recurrenceEndDate.toISOString()
      }

      if (recurrenceFrequency === "custom") {
        if (selectedDays.length > 0) {
          taskData.recurrence.daysOfWeek = selectedDays
        } else if (dayOfMonth) {
          taskData.recurrence.dayOfMonth = Number.parseInt(dayOfMonth)
        }
      }
    }

    onSubmit(taskData)
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault()
      addTag()
    }
  }

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return

    const newSubtask: Task = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      title: newSubtaskTitle,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
      parentId: task?.id || "",
      status: "todo",
    }

    setSubtasks([...subtasks, newSubtask])
    setNewSubtaskTitle("")
  }

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter((subtask) => subtask.id !== id))
  }

  const toggleSubtaskCompletion = (id: string) => {
    setSubtasks(
      subtasks.map((subtask) => (subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask)),
    )
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
  }

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="p-4 mb-6 border-2 border-primary/10">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Task Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Due Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? format(dueDate, "PPP") : "Select a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tags</Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1 px-2 py-1">
                {tag}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 ml-1 p-0 text-muted-foreground hover:text-foreground"
                  onClick={() => removeTag(tag)}
                  type="button"
                >
                  <X className="h-3 w-3" />
                  <span className="sr-only">Remove {tag}</span>
                </Button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a tag"
              className="flex-1"
              list="available-tags"
            />
            <datalist id="available-tags">
              {availableTags.map((tag) => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
            <Button type="button" size="icon" onClick={addTag} disabled={!newTag.trim()}>
              <Plus className="h-4 w-4" />
              <span className="sr-only">Add Tag</span>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="backlog">Backlog</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="review">Review</option>
              <option value="done">Done</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeEstimate">Time Estimate (minutes)</Label>
            <Input
              id="timeEstimate"
              type="number"
              min="0"
              value={timeEstimate}
              onChange={(e) => setTimeEstimate(e.target.value)}
              placeholder="Estimated time in minutes"
            />
          </div>
        </div>

        <Accordion type="single" collapsible>
          <AccordionItem value="recurrence">
            <AccordionTrigger onClick={() => setShowRecurrence(!showRecurrence)}>
              <div className="flex items-center">
                <Repeat className="mr-2 h-4 w-4" />
                Recurrence
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="recurrenceFrequency">Frequency</Label>
                    <select
                      id="recurrenceFrequency"
                      value={recurrenceFrequency}
                      onChange={(e) => setRecurrenceFrequency(e.target.value)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrenceInterval">Repeat every</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="recurrenceInterval"
                        type="number"
                        min="1"
                        value={recurrenceInterval}
                        onChange={(e) => setRecurrenceInterval(e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm">
                        {recurrenceFrequency === "daily"
                          ? "days"
                          : recurrenceFrequency === "weekly"
                            ? "weeks"
                            : recurrenceFrequency === "monthly"
                              ? "months"
                              : "intervals"}
                      </span>
                    </div>
                  </div>
                </div>

                {recurrenceFrequency === "custom" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Days of week</Label>
                      <div className="flex flex-wrap gap-2">
                        {dayNames.map((day, index) => (
                          <Badge
                            key={day}
                            variant={selectedDays.includes(index) ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => toggleDay(index)}
                          >
                            {day}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dayOfMonth">Day of month</Label>
                      <Input
                        id="dayOfMonth"
                        type="number"
                        min="1"
                        max="31"
                        value={dayOfMonth}
                        onChange={(e) => setDayOfMonth(e.target.value)}
                        placeholder="Day of month (1-31)"
                        disabled={selectedDays.length > 0}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>End Date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !recurrenceEndDate && "text-muted-foreground",
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {recurrenceEndDate ? format(recurrenceEndDate, "PPP") : "No end date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={recurrenceEndDate}
                        onSelect={setRecurrenceEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="subtasks">
            <AccordionTrigger>
              <div className="flex items-center">
                <ChevronDown className="mr-2 h-4 w-4" />
                Subtasks ({subtasks.length})
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4 pt-2">
                <div className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask"
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSubtaskTitle.trim()) {
                        e.preventDefault()
                        addSubtask()
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={addSubtask} disabled={!newSubtaskTitle.trim()}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>

                {subtasks.length > 0 ? (
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div key={subtask.id} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={subtask.completed}
                            onCheckedChange={() => toggleSubtaskCompletion(subtask.id)}
                            id={`subtask-${subtask.id}`}
                          />
                          <Label
                            htmlFor={`subtask-${subtask.id}`}
                            className={cn(subtask.completed && "line-through text-muted-foreground")}
                          >
                            {subtask.title}
                          </Label>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => removeSubtask(subtask.id)}
                          type="button"
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Remove</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No subtasks yet</div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex justify-between space-x-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>

          <div className="flex gap-2">
            {onSaveTemplate && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const templateTask: Task = {
                    id: "",
                    title,
                    description,
                    priority,
                    tags,
                    completed: false,
                    createdAt: new Date().toISOString(),
                    status,
                    timeEstimate: timeEstimate ? Number.parseInt(timeEstimate) : undefined,
                    subtasks: subtasks.length > 0 ? subtasks : undefined,
                    dueDate: dueDate?.toISOString(),
                  }

                  if (showRecurrence && dueDate) {
                    templateTask.recurrence = {
                      frequency: recurrenceFrequency as any,
                      interval: Number.parseInt(recurrenceInterval) || 1,
                    }

                    if (recurrenceEndDate) {
                      templateTask.recurrence.endDate = recurrenceEndDate.toISOString()
                    }

                    if (recurrenceFrequency === "custom") {
                      if (selectedDays.length > 0) {
                        templateTask.recurrence.daysOfWeek = selectedDays
                      } else if (dayOfMonth) {
                        templateTask.recurrence.dayOfMonth = Number.parseInt(dayOfMonth)
                      }
                    }
                  }

                  onSaveTemplate(templateTask)
                }}
              >
                <Save className="mr-2 h-4 w-4" />
                Save as Template
              </Button>
            )}

            <Button type="submit">{task ? "Update Task" : "Add Task"}</Button>
          </div>
        </div>
      </form>
    </Card>
  )
}
