"use client"

import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Bot, Brain, CheckCircle, AlertCircle, Clock, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface AgentStatusIndicatorProps {
  status: "idle" | "thinking" | "processing" | "complete" | "error"
  currentAction?: string
  progress?: number
  confidence?: number
  lastDecision?: string
  className?: string
}

export default function AgentStatusIndicator({
  status,
  currentAction,
  progress = 0,
  confidence,
  lastDecision,
  className,
}: AgentStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case "thinking":
        return {
          icon: Brain,
          color: "bg-[var(--agent-thinking)]",
          textColor: "text-foreground",
          label: "Analyzing",
          description: "AI is evaluating your data...",
        }
      case "processing":
        return {
          icon: Zap,
          color: "bg-[var(--agent-active)]",
          textColor: "text-primary-foreground",
          label: "Processing",
          description: currentAction || "Working on your data...",
        }
      case "complete":
        return {
          icon: CheckCircle,
          color: "bg-[var(--agent-success)]",
          textColor: "text-primary-foreground",
          label: "Complete",
          description: "Step completed successfully",
        }
      case "error":
        return {
          icon: AlertCircle,
          color: "bg-destructive",
          textColor: "text-destructive-foreground",
          label: "Error",
          description: "Something needs attention",
        }
      default:
        return {
          icon: Bot,
          color: "bg-muted",
          textColor: "text-muted-foreground",
          label: "Ready",
          description: "AI assistant is ready to help",
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-start gap-3">
        <div
          className={cn("p-2 rounded-lg flex-shrink-0", config.color, status === "thinking" && "animate-pulse-agent")}
        >
          <Icon className={cn("h-4 w-4", config.textColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-sm">{config.label}</h4>
            {status === "processing" && (
              <Badge variant="secondary" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Active
              </Badge>
            )}
          </div>

          <p className="text-xs text-muted-foreground mb-2">{config.description}</p>

          {progress > 0 && (
            <div className="space-y-1">
              <Progress value={progress} className="h-1" />
              <p className="text-xs text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          )}

          {confidence !== undefined && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Confidence</span>
                <span
                  className={cn(
                    "font-medium",
                    confidence >= 0.8 ? "text-accent" : confidence >= 0.6 ? "text-primary" : "text-destructive",
                  )}
                >
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>
          )}

          {lastDecision && (
            <div className="mt-2 p-2 bg-muted/50 rounded text-xs">
              <span className="text-muted-foreground">Last decision: </span>
              <span className="text-foreground">{lastDecision}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
