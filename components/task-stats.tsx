"use client"

import { useMemo } from "react"
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from "date-fns"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import type { Task } from "@/types/task"

interface TaskStatsProps {
  tasks: Task[]
}

export function TaskStats({ tasks }: TaskStatsProps) {
  const stats = useMemo(() => {
    const total = tasks.length
    const completed = tasks.filter((task) => task.completed).length
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // Priority breakdown
    const byPriority = {
      high: tasks.filter((task) => task.priority === "high").length,
      medium: tasks.filter((task) => task.priority === "medium").length,
      low: tasks.filter((task) => task.priority === "low").length,
    }

    // Tasks due this week
    const today = new Date()
    const weekStart = startOfWeek(today)
    const weekEnd = endOfWeek(today)
    const dueThisWeek = tasks.filter(
      (task) => task.dueDate && new Date(task.dueDate) >= weekStart && new Date(task.dueDate) <= weekEnd,
    ).length

    // Overdue tasks
    const overdue = tasks.filter((task) => !task.completed && task.dueDate && new Date(task.dueDate) < today).length

    // Tasks by tag
    const byTag: Record<string, number> = {}
    tasks.forEach((task) => {
      if (task.tags) {
        task.tags.forEach((tag) => {
          byTag[tag] = (byTag[tag] || 0) + 1
        })
      }
    })

    // Tasks completed by day (last 7 days)
    const last7Days = eachDayOfInterval({
      start: new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000),
      end: today,
    })

    const completedByDay = last7Days.map((day) => {
      return {
        date: day,
        count: tasks.filter((task) => task.completed && task.createdAt && isSameDay(new Date(task.createdAt), day))
          .length,
      }
    })

    return {
      total,
      completed,
      active: total - completed,
      completionRate,
      byPriority,
      dueThisWeek,
      overdue,
      byTag,
      completedByDay,
    }
  }, [tasks])

  // Get top 5 tags
  const topTags = useMemo(() => {
    return Object.entries(stats.byTag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
  }, [stats.byTag])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Tasks</CardDescription>
            <CardTitle className="text-3xl">{stats.total}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">{stats.completionRate}%</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={stats.completionRate} className="h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Due This Week</CardDescription>
            <CardTitle className="text-3xl">{stats.dueThisWeek}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue Tasks</CardDescription>
            <CardTitle className={`text-3xl ${stats.overdue > 0 ? "text-destructive" : ""}`}>{stats.overdue}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">High</span>
                  <span className="text-sm text-muted-foreground">{stats.byPriority.high}</span>
                </div>
                <Progress
                  value={stats.total > 0 ? (stats.byPriority.high / stats.total) * 100 : 0}
                  className="h-2 bg-muted"
                  indicatorClassName="bg-red-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Medium</span>
                  <span className="text-sm text-muted-foreground">{stats.byPriority.medium}</span>
                </div>
                <Progress
                  value={stats.total > 0 ? (stats.byPriority.medium / stats.total) * 100 : 0}
                  className="h-2 bg-muted"
                  indicatorClassName="bg-yellow-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">Low</span>
                  <span className="text-sm text-muted-foreground">{stats.byPriority.low}</span>
                </div>
                <Progress
                  value={stats.total > 0 ? (stats.byPriority.low / stats.total) * 100 : 0}
                  className="h-2 bg-muted"
                  indicatorClassName="bg-green-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Tags</CardTitle>
          </CardHeader>
          <CardContent>
            {topTags.length > 0 ? (
              <div className="space-y-4">
                {topTags.map(([tag, count]) => (
                  <div key={tag}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium">{tag}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </div>
                    <Progress value={stats.total > 0 ? (count / stats.total) * 100 : 0} className="h-2 bg-muted" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">No tags added yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tasks Completed (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {stats.completedByDay.map((day) => (
              <div key={day.date.toISOString()} className="text-center">
                <div className="text-xs text-muted-foreground mb-1">{format(day.date, "EEE")}</div>
                <div
                  className={`rounded-md py-2 px-1 text-xs font-medium ${
                    day.count > 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {day.count}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
