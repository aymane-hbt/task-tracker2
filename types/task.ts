export interface Task {
  id: string
  title: string
  description?: string
  dueDate?: string
  priority: string
  tags?: string[]
  completed: boolean
  createdAt: string
  parentId?: string
  subtasks?: Task[]
  timeSpent?: number // in minutes
  timeEstimate?: number // in minutes
  recurrence?: {
    frequency: "daily" | "weekly" | "monthly" | "custom"
    interval: number
    endDate?: string
    daysOfWeek?: number[] // 0-6, Sunday to Saturday
    dayOfMonth?: number
  }
  status?: "backlog" | "todo" | "in-progress" | "review" | "done"
  isTemplate?: boolean
  templateId?: string
}

export type TaskView = "list" | "kanban" | "calendar"

export type TaskFilter = {
  status: string[]
  priority: string[]
  tags: string[]
  search: string
  showCompleted: boolean
  showSubtasks: boolean
}
