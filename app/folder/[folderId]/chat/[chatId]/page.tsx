"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { GraduationCap, PaperclipIcon, Send, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Message } from "@/lib/gemini";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";

interface UploadProgress {
  fileName: string;
  progress: number;
  status: string;
}

async function uploadToCloudinary(file: File): Promise<string> {
  try {
    console.log("Uploading file to Cloudinary:", file.name);
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Upload failed");
    }

    const result = await response.json();
    console.log("Cloudinary upload successful:", result);
    return result.url;
  } catch (error) {
    console.error("Error uploading to Cloudinary:", error);
    throw new Error("Failed to upload file");
  }
}

export default function ChatPage() {
  const { chatId } = useParams();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        console.log("Fetching messages for chat:", chatId);
        const response = await fetch(`/api/chat?instanceId=${chatId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        console.log("Fetched messages:", data.messages);
        setMessages(data.messages);
      } catch (error) {
        console.error("Failed to fetch messages:", error);
        toast({
          title: "Error",
          description: "Failed to fetch chat history",
          variant: "destructive",
        });
      }
    };

    fetchMessages();
  }, [chatId, toast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = input.trim();
    setInput("");
    console.log("Sending message:", userMessage);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          instanceId: chatId,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      console.log("Received response:", data.messages);
      setMessages((prev) => [...prev, ...data.messages]);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
      setInput(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      console.log("Starting file upload:", file.name);
      setUploadProgress({
        fileName: file.name,
        progress: 0,
        status: "Uploading to Cloudinary...",
      });

      const url = await uploadToCloudinary(file);
      setUploadProgress({
        fileName: file.name,
        progress: 50,
        status: "Processing with AI...",
      });

      const messageResponse = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "Analyzing uploaded file...",
          instanceId: chatId,
          attachment: {
            type: file.type.startsWith("image/") ? "image" : "document",
            url,
            name: file.name,
          },
        }),
      });

      const messageData = await messageResponse.json();
      if (!messageResponse.ok) throw new Error(messageData.error);

      console.log("File processed successfully:", messageData);
      setMessages((prev) => [...prev, ...messageData.messages]);
      setUploadProgress(null);
    } catch (error) {
      console.error("Failed to upload file:", error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      setUploadProgress(null);
    }
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-4 md:px-8">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <h1 className="text-2xl font-semibold text-foreground mb-2">
                Welcome to Study Assistant
              </h1>
              <p className="text-muted-foreground max-w-md">
                Ask me anything! I'm here to help you with your studies.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div key={index} className="flex gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback
                      className="flex items-center justify-center h-full w-full text-primary-foreground"
                      style={{
                        background:
                          message.role === "user"
                            ? "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))"
                            : "linear-gradient(135deg, hsl(var(--secondary)), hsl(var(--primary)))",
                      }}
                    >
                      {message.role === "user" ? (
                        <User className="h-5 w-5" />
                      ) : (
                        <GraduationCap className="h-5 w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                      <span className="text-foreground font-semibold">
                        {message.role === "user" ? "You" : "Study Assistant"}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        {message.timestamp &&
                          new Date(message.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                      </span>
                    </div>

                    <div className="p-3 bg-muted rounded-lg">
                      <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw, rehypeSanitize]}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>

                      {message.attachments?.map((attachment, idx) => (
                        <div key={idx} className="mt-3">
                          {attachment.type === "image" ? (
                            <div className="relative rounded-lg overflow-hidden border border-border">
                              <img
                                src={attachment.url}
                                alt={attachment.name}
                                className="w-full h-auto max-h-[260px] object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 bg-background p-2 rounded-lg border border-border">
                              <PaperclipIcon className="h-4 w-4 text-muted-foreground" />
                              <a
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline text-sm"
                              >
                                {attachment.name}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border bg-background">
        <div className="max-w-4xl mx-auto p-4">
          {uploadProgress && (
            <div className="mb-4 p-4 bg-muted rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-foreground">
                  {uploadProgress.fileName}
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(uploadProgress.progress)}%
                </span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress.progress}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {uploadProgress.status}
              </p>
            </div>
          )}

          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="Type a message..."
              className="min-h-[60px] w-full resize-none rounded-lg border-border bg-muted p-4 pr-20 focus-visible:ring-1 focus-visible:ring-primary md:min-h-[80px]"
              disabled={isLoading}
            />
            <div className="absolute bottom-4 right-4 flex items-center gap-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileUpload(file);
                  }
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                className="hidden"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleFileSelect}
                disabled={isLoading}
                className="text-muted-foreground hover:text-foreground"
              >
                <PaperclipIcon className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="bg-primary hover:bg-primary/90"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
