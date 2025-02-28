"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, User, Bot, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

type Message = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm your study assistant. Ask me anything about your notes or any other questions you have.",
      sender: "ai",
      timestamp: new Date(),
    },
  ])
  const [inputValue, setInputValue] = useState("")
  const [isPdfOnly, setIsPdfOnly] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = () => {
    if (inputValue.trim() === "") return

    const newUserMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, newUserMessage])
    setInputValue("")
    setIsLoading(true)

    // Simulate AI response after a delay
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue, isPdfOnly)
      setMessages((prev) => [...prev, aiResponse])
      setIsLoading(false)
    }, 1500)
  }

  const generateAIResponse = (userMessage: string, pdfOnly: boolean): Message => {
    let responseContent = ""

    if (pdfOnly) {
      responseContent = `Based on your uploaded notes, ${
        userMessage.toLowerCase().includes("mitochondria")
          ? "mitochondria are the powerhouse of the cell, responsible for generating ATP through cellular respiration."
          : "I can only answer questions based on your uploaded documents. Please upload relevant notes or switch to extended mode for more general answers."
      }`
    } else {
      if (userMessage.toLowerCase().includes("mitochondria")) {
        responseContent =
          "Mitochondria are organelles found in most eukaryotic cells. They are often referred to as the powerhouse of the cell because they generate most of the cell's supply of adenosine triphosphate (ATP), used as a source of chemical energy."
      } else if (userMessage.toLowerCase().includes("dna")) {
        responseContent =
          "DNA (deoxyribonucleic acid) is a molecule composed of two polynucleotide chains that coil around each other to form a double helix carrying genetic instructions for the development, functioning, growth and reproduction of all known organisms and many viruses."
      } else {
        responseContent =
          "I can answer questions about your notes and provide additional information from my knowledge base. What specific topic would you like to learn more about?"
      }
    }

    return {
      id: Date.now().toString(),
      content: responseContent,
      sender: "ai",
      timestamp: new Date(),
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const toggleMode = () => {
    setIsPdfOnly(!isPdfOnly)

    // Add a system message about the mode change
    const modeChangeMessage: Message = {
      id: Date.now().toString(),
      content: !isPdfOnly
        ? "Switched to PDF-only mode. I'll only answer questions based on your uploaded documents."
        : "Switched to extended mode. I can now answer questions using both your documents and my general knowledge.",
      sender: "ai",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, modeChangeMessage])
  }

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="flex items-center mb-4">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-3xl font-bold">Chat</h1>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="px-4 py-3 border-b flex justify-between items-center">
          <CardTitle className="text-lg">Study Assistant</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="mode-toggle" className="text-sm cursor-pointer">
              {isPdfOnly ? (
                <span className="flex items-center">
                  <ToggleLeft className="h-4 w-4 mr-1" />
                  PDF Only
                </span>
              ) : (
                <span className="flex items-center">
                  <ToggleRight className="h-4 w-4 mr-1" />
                  Extended Mode
                </span>
              )}
            </Label>
            <Switch id="mode-toggle" checked={!isPdfOnly} onCheckedChange={toggleMode} />
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-3 max-w-[80%] ${message.sender === "user" ? "flex-row-reverse" : ""}`}>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={message.sender === "user" ? "bg-primary" : "bg-muted"}>
                      {message.sender === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={`rounded-lg p-3 ${
                      message.sender === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3 max-w-[80%]">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>

                  <div className="rounded-lg p-3 bg-muted">
                    <div className="flex space-x-2">
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="h-2 w-2 rounded-full bg-muted-foreground/30 animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        <CardFooter className="p-4 border-t">
          <form
            className="flex w-full gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
          >
            <Input
              placeholder="Type your message..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={inputValue.trim() === "" || isLoading}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

