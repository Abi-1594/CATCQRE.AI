"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Clock, AlertCircle, Play, Pause, Settings, Brain } from "lucide-react"
import { cn } from "@/lib/utils"

interface WorkflowStep {
  id: number
  name: string
  status: "pending" | "active" | "complete" | "error" | "paused"
  confidence?: number
  aiDecision?: string
  userOverride?: boolean
  estimatedTime?: string
}

interface AutonomousWorkflowDashboardProps {
  steps: WorkflowStep[]
  currentStep: number
  onStepClick?: (stepId: number) => void
  onPauseResume?: () => void
  onConfigureStep?: (stepId: number) => void
  isPaused?: boolean
  className?: string
}

export default function AutonomousWorkflowDashboard({
  steps,
  currentStep,
  onStepClick,
  onPauseResume,
  onConfigureStep,
  isPaused = false,
  className,
}: AutonomousWorkflowDashboardProps) {
  const getStatusIcon = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-4 w-4 text-accent" />
      case "active":
        return <Clock className="h-4 w-4 text-primary animate-pulse-agent" />
      case "error":
        return <AlertCircle className="h-4 w-4 text-destructive" />
      case "paused":
        return <Pause className="h-4 w-4 text-muted-foreground" />
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-muted" />
    }
  }

  const getStatusColor = (status: WorkflowStep["status"]) => {
    switch (status) {
      case "complete":
        return "border-accent bg-accent/5"
      case "active":
        return "border-primary bg-primary/5"
      case "error":
        return "border-destructive bg-destructive/5"
      case "paused":
        return "border-muted bg-muted/5"
      default:
        return "border-border bg-card"
    }
  }

  const completedSteps = steps.filter((step) => step.status === "complete").length
  const totalSteps = steps.length
  const overallProgress = (completedSteps / totalSteps) * 100

  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            Autonomous Workflow
          </h3>
          <p className="text-sm text-muted-foreground">AI-guided data processing with intelligent decision making</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onPauseResume}
            className="flex items-center gap-2 bg-transparent"
          >
            {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Overall Progress</span>
          <span className="text-sm text-muted-foreground">
            {completedSteps} of {totalSteps} steps complete
          </span>
        </div>
        <Progress value={overallProgress} className="h-2" />
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={cn(
              "p-4 rounded-lg border-2 transition-all cursor-pointer hover:shadow-sm",
              getStatusColor(step.status),
              step.status === "active" && "ring-2 ring-primary/20",
            )}
            onClick={() => onStepClick?.(step.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getStatusIcon(step.status)}
                <div>
                  <h4 className="font-medium text-sm">{step.name}</h4>
                  {step.aiDecision && (
                    <p className="text-xs text-muted-foreground mt-1">AI Decision: {step.aiDecision}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {step.confidence !== undefined && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      step.confidence >= 0.8
                        ? "bg-accent/20 text-accent"
                        : step.confidence >= 0.6
                          ? "bg-primary/20 text-primary"
                          : "bg-destructive/20 text-destructive",
                    )}
                  >
                    {Math.round(step.confidence * 100)}% confidence
                  </Badge>
                )}

                {step.userOverride && (
                  <Badge variant="outline" className="text-xs">
                    User Override
                  </Badge>
                )}

                {step.estimatedTime && step.status === "pending" && (
                  <span className="text-xs text-muted-foreground">~{step.estimatedTime}</span>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    onConfigureStep?.(step.id)
                  }}
                  className="h-6 w-6 p-0"
                >
                  <Settings className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {step.status === "active" && (
              <div className="mt-3">
                <Progress value={65} className="h-1" />
              </div>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
