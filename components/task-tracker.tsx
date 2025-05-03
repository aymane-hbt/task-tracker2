"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  PlusCircle,
  Search,
  BarChart,
  List,
  Kanban,
  Calendar,
  Download,
  Upload,
  LayoutTemplateIcon as Template,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { TaskForm } from "@/components/task-form"
import { TaskList } from "@/components/task-list"
import { TaskStats } from "@/components/task-stats"
import { KanbanBoard } from "@/components/kanban-board"
import { CalendarView } from "@/components/calendar-view"
import { ThemeToggle } from "@/components/theme-toggle"
import { TaskTemplates } from "@/components/task-templates"
import { useToast } from "@/hooks/use-toast"
import type { Task, TaskView, TaskFilter } from "@/types/task"

export default function TaskTracker() {
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [templates, setTemplates] = useState<Task[]>([])
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("tasks")
  const [taskView, setTaskView] = useState<TaskView>("list")
  const [availableTags, setAvailableTags] = useState<string[]>([])
  const [showTemplates, setShowTemplates] = useState(false)
  const [filter, setFilter] = useState<TaskFilter>({
    status: [],
    priority: [],
    tags: [],
    search: "",
    showCompleted: true,
    showSubtasks: true,
  })

  // Load tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem("tasks")
    const savedTemplates = localStorage.getItem("taskTemplates")

    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks))
      } catch (error) {
        console.error("Failed to parse saved tasks:", error)
      }
    }

    if (savedTemplates) {
      try {
        setTemplates(JSON.parse(savedTemplates))
      } catch (error) {
        console.error("Failed to parse saved templates:", error)
      }
    }
  }, [])

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(tasks))

    // Update available tags
    const tags = new Set<string>()
    const processTaskTags = (task: Task) => {
      if (task.tags) {
        task.tags.forEach((tag) => tags.add(tag))
      }
      if (task.subtasks) {
        task.subtasks.forEach(processTaskTags)
      }
    }

    tasks.forEach(processTaskTags)
    setAvailableTags(Array.from(tags))
  }, [tasks])

  // Save templates to localStorage
  useEffect(() => {
    localStorage.setItem("taskTemplates", JSON.stringify(templates))
  }, [templates])

  // Process recurring tasks
  useEffect(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const newTasks: Task[] = []

    tasks.forEach((task) => {
      if (task.recurrence && task.dueDate) {
        const dueDate = new Date(task.dueDate)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < today && !task.completed) {
          // Create next occurrence
          const nextDueDate = getNextOccurrence(task)

          if (nextDueDate) {
            const newTask: Task = {
              ...task,
              id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
              completed: false,
              dueDate: nextDueDate.toISOString(),
              createdAt: new Date().toISOString(),
            }

            newTasks.push(newTask)
          }
        }
      }
    })

    if (newTasks.length > 0) {
      setTasks((prev) => [...prev, ...newTasks])
      toast({
        title: "Recurring tasks created",
        description: `${newTasks.length} recurring task(s) have been created.`,
      })
    }
  }, [toast])

  const getNextOccurrence = (task: Task): Date | null => {
    if (!task.recurrence || !task.dueDate) return null

    const dueDate = new Date(task.dueDate)
    const { frequency, interval, endDate } = task.recurrence

    if (endDate && new Date(endDate) < new Date()) {
      return null // Recurrence has ended
    }

    let nextDate = new Date(dueDate)

    switch (frequency) {
      case "daily":
        nextDate.setDate(nextDate.getDate() + interval)
        break
      case "weekly":
        nextDate.setDate(nextDate.getDate() + interval * 7)
        break
      case "monthly":
        nextDate.setMonth(nextDate.getMonth() + interval)
        break
      case "custom":
        // Handle custom recurrence logic
        if (task.recurrence.daysOfWeek && task.recurrence.daysOfWeek.length > 0) {
          // Find the next day of week that matches
          let found = false
          const currentDate = new Date(dueDate)
          currentDate.setDate(currentDate.getDate() + 1) // Start from next day

          // Try for up to 14 days to find a matching day
          for (let i = 0; i < 14; i++) {
            const dayOfWeek = currentDate.getDay()
            if (task.recurrence.daysOfWeek.includes(dayOfWeek)) {
              nextDate = new Date(currentDate)
              found = true
              break
            }
            currentDate.setDate(currentDate.getDate() + 1)
          }

          if (!found) return null
        } else if (task.recurrence.dayOfMonth) {
          // Set to the same day next month
          nextDate.setMonth(nextDate.getMonth() + 1)
          nextDate.setDate(task.recurrence.dayOfMonth)
        }
        break
    }

    return nextDate
  }

  const addTask = (task: Task) => {
    const newTask = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      status: task.status || "todo",
    }

    // If it's a subtask, add it to the parent
    if (task.parentId) {
      setTasks((prevTasks) => {
        return prevTasks.map((t) => {
          if (t.id === task.parentId) {
            return {
              ...t,
              subtasks: [...(t.subtasks || []), newTask],
            }
          }
          return t
        })
      })
    } else {
      setTasks((prevTasks) => [...prevTasks, newTask])
    }

    setIsAddingTask(false)
    toast({
      title: "Task created",
      description: "Your task has been created successfully.",
    })
  }

  const updateTask = (updatedTask: Task) => {
    // If it's a subtask, update it in the parent
    if (updatedTask.parentId) {
      setTasks((prevTasks) => {
        return prevTasks.map((task) => {
          if (task.id === updatedTask.parentId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).map((subtask) => (subtask.id === updatedTask.id ? updatedTask : subtask)),
            }
          }
          return task
        })
      })
    } else {
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task)))
    }

    setEditingTask(null)
    toast({
      title: "Task updated",
      description: "Your task has been updated successfully.",
    })
  }

  const deleteTask = (id: string, parentId?: string) => {
    // If it has a parentId, remove it from the parent's subtasks
    if (parentId) {
      setTasks((prevTasks) => {
        return prevTasks.map((task) => {
          if (task.id === parentId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).filter((subtask) => subtask.id !== id),
            }
          }
          return task
        })
      })
    } else {
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== id))
    }

    toast({
      title: "Task deleted",
      description: "Your task has been deleted.",
    })
  }

  const duplicateTask = (task: Task) => {
    const duplicatedTask = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      title: `${task.title} (Copy)`,
      createdAt: new Date().toISOString(),
      completed: false,
      // Duplicate subtasks if any
      subtasks: task.subtasks
        ? task.subtasks.map((subtask) => ({
            ...subtask,
            id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
            completed: false,
          }))
        : undefined,
    }

    setTasks((prevTasks) => [...prevTasks, duplicatedTask])
    toast({
      title: "Task duplicated",
      description: "Your task has been duplicated.",
    })
  }

  const toggleTaskCompletion = (id: string, parentId?: string) => {
    // If it has a parentId, toggle it in the parent's subtasks
    if (parentId) {
      setTasks((prevTasks) => {
        return prevTasks.map((task) => {
          if (task.id === parentId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).map((subtask) =>
                subtask.id === id ? { ...subtask, completed: !subtask.completed } : subtask,
              ),
            }
          }
          return task
        })
      })
    } else {
      setTasks((prevTasks) =>
        prevTasks.map((task) => (task.id === id ? { ...task, completed: !task.completed } : task)),
      )
    }
  }

  const updateTaskStatus = (id: string, status: string, parentId?: string) => {
    // If it has a parentId, update it in the parent's subtasks
    if (parentId) {
      setTasks((prevTasks) => {
        return prevTasks.map((task) => {
          if (task.id === parentId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).map((subtask) =>
                subtask.id === id ? { ...subtask, status: status as any } : subtask,
              ),
            }
          }
          return task
        })
      })
    } else {
      setTasks((prevTasks) => prevTasks.map((task) => (task.id === id ? { ...task, status: status as any } : task)))
    }
  }

  const updateTaskTime = (id: string, timeSpent: number, parentId?: string) => {
    // If it has a parentId, update it in the parent's subtasks
    if (parentId) {
      setTasks((prevTasks) => {
        return prevTasks.map((task) => {
          if (task.id === parentId) {
            return {
              ...task,
              subtasks: (task.subtasks || []).map((subtask) =>
                subtask.id === id
                  ? {
                      ...subtask,
                      timeSpent: (subtask.timeSpent || 0) + timeSpent,
                    }
                  : subtask,
              ),
            }
          }
          return task
        })
      })
    } else {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === id
            ? {
                ...task,
                timeSpent: (task.timeSpent || 0) + timeSpent,
              }
            : task,
        ),
      )
    }
  }

  const saveAsTemplate = (task: Task) => {
    const template = {
      ...task,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      isTemplate: true,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    setTemplates((prev) => [...prev, template])
    toast({
      title: "Template saved",
      description: "Your task has been saved as a template.",
    })
  }

  const createFromTemplate = (template: Task) => {
    const newTask = {
      ...template,
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      isTemplate: false,
      templateId: template.id,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: template.dueDate ? new Date().toISOString() : undefined, // Reset due date
    }

    setTasks((prev) => [...prev, newTask])
    toast({
      title: "Task created",
      description: "Task created from template.",
    })
  }

  const deleteTemplate = (id: string) => {
    setTemplates((prev) => prev.filter((template) => template.id !== id))
    toast({
      title: "Template deleted",
      description: "Your template has been deleted.",
    })
  }

  const exportTasks = () => {
    const dataStr = JSON.stringify({ tasks, templates }, null, 2)
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`

    const exportFileDefaultName = `task-tracker-export-${new Date().toISOString().slice(0, 10)}.json`

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportFileDefaultName)
    linkElement.click()

    toast({
      title: "Tasks exported",
      description: "Your tasks and templates have been exported.",
    })
  }

  const importTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const parsed = JSON.parse(content)

        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          setTasks(parsed.tasks)
        }

        if (parsed.templates && Array.isArray(parsed.templates)) {
          setTemplates(parsed.templates)
        }

        toast({
          title: "Tasks imported",
          description: "Your tasks and templates have been imported successfully.",
        })
      } catch (error) {
        toast({
          title: "Import failed",
          description: "There was an error importing your tasks.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Reset the input
    event.target.value = ""
  }

  // Filter tasks based on search query and filters
  const filteredTasks = tasks.filter((task) => {
    // Skip templates
    if (task.isTemplate) return false

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesSearch =
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(query)))

      if (!matchesSearch) return false
    }

    // Filter by status
    if (filter.status.length > 0 && task.status && !filter.status.includes(task.status)) {
      return false
    }

    // Filter by priority
    if (filter.priority.length > 0 && !filter.priority.includes(task.priority)) {
      return false
    }

    // Filter by tags
    if (filter.tags.length > 0) {
      if (!task.tags || !task.tags.some((tag) => filter.tags.includes(tag))) {
        return false
      }
    }

    // Filter by completion status
    if (!filter.showCompleted && task.completed) {
      return false
    }

    return true
  })

  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl">Advanced Task Tracker</CardTitle>
          <CardDescription>Manage your tasks efficiently</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
                <span className="sr-only">Export/Import</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportTasks}>
                <Download className="mr-2 h-4 w-4" />
                Export Tasks
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <label className="flex items-center cursor-pointer">
                  <Upload className="mr-2 h-4 w-4" />
                  Import Tasks
                  <input type="file" accept=".json" className="hidden" onChange={importTasks} />
                </label>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="icon" onClick={() => setShowTemplates((prev) => !prev)}>
            <Template className="h-4 w-4" />
            <span className="sr-only">Templates</span>
          </Button>

          <Button onClick={() => setIsAddingTask(true)} disabled={isAddingTask}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showTemplates ? (
          <TaskTemplates
            templates={templates}
            onUseTemplate={createFromTemplate}
            onDeleteTemplate={deleteTemplate}
            onClose={() => setShowTemplates(false)}
          />
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="tasks">
                <Search className="mr-2 h-4 w-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="views">
                <Kanban className="mr-2 h-4 w-4" />
                Views
              </TabsTrigger>
              <TabsTrigger value="stats">
                <BarChart className="mr-2 h-4 w-4" />
                Statistics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {isAddingTask && (
                <TaskForm
                  onSubmit={addTask}
                  onCancel={() => setIsAddingTask(false)}
                  availableTags={availableTags}
                  onSaveTemplate={saveAsTemplate}
                />
              )}

              {editingTask && (
                <TaskForm
                  task={editingTask}
                  onSubmit={updateTask}
                  onCancel={() => setEditingTask(null)}
                  availableTags={availableTags}
                  onSaveTemplate={saveAsTemplate}
                />
              )}

              <TaskList
                tasks={filteredTasks}
                onDelete={deleteTask}
                onEdit={setEditingTask}
                onToggleComplete={toggleTaskCompletion}
                onDuplicate={duplicateTask}
                onUpdateStatus={updateTaskStatus}
                onUpdateTime={updateTaskTime}
                availableTags={availableTags}
                filter={filter}
                setFilter={setFilter}
              />
            </TabsContent>

            <TabsContent value="views" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <div className="flex gap-2">
                  <Button
                    variant={taskView === "list" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTaskView("list")}
                  >
                    <List className="mr-2 h-4 w-4" />
                    List
                  </Button>
                  <Button
                    variant={taskView === "kanban" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTaskView("kanban")}
                  >
                    <Kanban className="mr-2 h-4 w-4" />
                    Kanban
                  </Button>
                  <Button
                    variant={taskView === "calendar" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTaskView("calendar")}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Calendar
                  </Button>
                </div>

                <Button variant="outline" size="sm" onClick={() => setIsAddingTask(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </div>

              {taskView === "list" && (
                <TaskList
                  tasks={filteredTasks}
                  onDelete={deleteTask}
                  onEdit={setEditingTask}
                  onToggleComplete={toggleTaskCompletion}
                  onDuplicate={duplicateTask}
                  onUpdateStatus={updateTaskStatus}
                  onUpdateTime={updateTaskTime}
                  availableTags={availableTags}
                  filter={filter}
                  setFilter={setFilter}
                />
              )}

              {taskView === "kanban" && (
                <KanbanBoard
                  tasks={filteredTasks}
                  onDelete={deleteTask}
                  onEdit={setEditingTask}
                  onToggleComplete={toggleTaskCompletion}
                  onUpdateStatus={updateTaskStatus}
                  filter={filter}
                  setFilter={setFilter}
                />
              )}

              {taskView === "calendar" && <CalendarView tasks={filteredTasks} onEdit={setEditingTask} />}
            </TabsContent>

            <TabsContent value="stats">
              <TaskStats tasks={tasks} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  )
}
