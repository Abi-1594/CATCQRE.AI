"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, Bot, User, Lightbulb, AlertCircle, CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Message {
  id: string
  type: "user" | "agent"
  content: string
  timestamp: Date
  status?: "thinking" | "complete" | "error"
  explanation?: string
}

interface AgenticChatProps {
  onAgentAction?: (action: string, data?: any) => void
  currentStep?: number
  processingStatus?: string
}

export default function AgenticChat({ onAgentAction, currentStep, processingStatus }: AgenticChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "agent",
      content:
        "Hello! I'm your AI assistant for data cleansing. I can help you understand each step, explain my decisions, and guide you through the process. What would you like to know?",
      timestamp: new Date(),
      status: "complete",
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isAgentThinking, setIsAgentThinking] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputValue("")
    setIsAgentThinking(true)

    // Simulate AI response
    setTimeout(() => {
      const agentResponse = generateAgentResponse(inputValue, currentStep)
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "agent",
        content: agentResponse.content,
        timestamp: new Date(),
        status: "complete",
        explanation: agentResponse.explanation,
      }

      setMessages((prev) => [...prev, agentMessage])
      setIsAgentThinking(false)

      if (agentResponse.action && onAgentAction) {
        onAgentAction(agentResponse.action, agentResponse.data)
      }
    }, 1500)
  }

  const generateAgentResponse = (userInput: string, step?: number) => {
    const input = userInput.toLowerCase()

    if (input.includes("explain") || input.includes("why")) {
      return {
        content:
          "I make decisions based on data quality patterns, business rules, and learned behaviors from previous processing sessions. Each step is designed to progressively clean and enhance your data while maintaining accuracy.",
        explanation:
          "My decision-making process involves analyzing data patterns, applying configured business rules, and leveraging machine learning from past successful cleanses.",
      }
    }

    if (input.includes("next") || input.includes("continue")) {
      return {
        content:
          "I'll guide you to the next step. Based on your current progress, I recommend proceeding with the configured settings. Would you like me to explain what will happen next?",
        action: "proceed_next_step",
      }
    }

    if (input.includes("help") || input.includes("stuck")) {
      return {
        content:
          "I'm here to help! I can explain any step, suggest optimal settings, or troubleshoot issues. What specific aspect would you like assistance with?",
        explanation: "I can provide contextual help based on your current step and data characteristics.",
      }
    }

    if (input.includes("quality") || input.includes("accuracy")) {
      return {
        content:
          "Data quality is my priority. I use multiple validation layers, confidence scoring, and learned patterns to ensure high accuracy. I can show you quality metrics for each processing step.",
        explanation:
          "Quality assurance involves geocoding confidence scores, business rule validation, and pattern matching against known good data.",
      }
    }

    return {
      content:
        "I understand you're asking about the data processing. Let me provide some context based on your current step and help you make the best decisions for your data quality goals.",
      explanation: "I analyze your question in context of the current processing step to provide relevant guidance.",
    }
  }

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <div className="p-4 border-b border-border bg-primary/5">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold text-sm">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">{isAgentThinking ? "Thinking..." : "Ready to help"}</p>
          </div>
          {isAgentThinking && (
            <div className="ml-auto">
              <div className="flex gap-1">
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-thinking-dots"
                  style={{ animationDelay: "0ms" }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-thinking-dots"
                  style={{ animationDelay: "150ms" }}
                />
                <div
                  className="w-2 h-2 bg-primary rounded-full animate-thinking-dots"
                  style={{ animationDelay: "300ms" }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn("flex gap-3", message.type === "user" ? "justify-end" : "justify-start")}
            >
              {message.type === "agent" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    <Bot className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}

              <div
                className={cn(
                  "max-w-[80%] rounded-lg p-3 text-sm",
                  message.type === "user"
                    ? "bg-[var(--conversation-user)] text-foreground ml-auto"
                    : "bg-[var(--conversation-agent)] text-foreground",
                )}
              >
                <p className="leading-relaxed">{message.content}</p>

                {message.explanation && (
                  <div className="mt-2 pt-2 border-t border-border/50">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-3 w-3 text-accent mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">{message.explanation}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {message.status === "complete" && <CheckCircle className="h-3 w-3 text-accent" />}
                  {message.status === "error" && <AlertCircle className="h-3 w-3 text-destructive" />}
                </div>
              </div>

              {message.type === "user" && (
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about the data processing..."
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            className="flex-1"
            disabled={isAgentThinking}
          />
          <Button
            onClick={handleSendMessage}
            size="sm"
            disabled={!inputValue.trim() || isAgentThinking}
            className="px-3"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}
