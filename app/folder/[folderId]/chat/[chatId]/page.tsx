"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send, ToggleLeft, ToggleRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

type Message = {
  id: string
  content: string
  sender: "user" | "ai"
  timestamp: Date
}

export default function ChatPage({ params }: { params: { folderId: string; chatId: string } }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: `Hello! I'm your study assistant for Chat ${params.chatId}. Ask me anything about your notes or any other questions you have.`,
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
  }, [messages])

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
    let response: string
    if (pdfOnly) {
      response = `(PDF-only mode) I received your message: "${userMessage}". I'm processing it using only your uploaded documents.`
    } else {
      response = `I received your message: "${userMessage}". I'm processing it using both your documents and my general knowledge.`
    }

    return {
      id: Date.now().toString(),
      content: response,
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
      <h1 className="text-3xl font-bold mb-4">Chat {params.chatId}</h1>

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
              <div key={message.id} className="flex items-start gap-2">
                {message.sender === "user" ? (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                    <AvatarFallback>CN</AvatarFallback>
                  </Avatar>
                ) : (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="https://robohash.org/doloremquesintdolores.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div className="text-sm text-gray-500">
                    {message.sender === "user" ? "You" : "Study Assistant"} - {message.timestamp.toLocaleTimeString()}
                  </div>
                  <div className="prose dark:prose-invert w-full">
                    <p>{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex items-start gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://robohash.org/doloremquesintdolores.png" alt="AI" />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm text-gray-500">Study Assistant is thinking...</div>
                  <div className="prose dark:prose-invert w-full">
                    <p>Loading...</p>
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

