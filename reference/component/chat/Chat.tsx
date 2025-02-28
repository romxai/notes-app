"use client";

import { useState, useEffect } from "react";
import { ChatInput } from "./ChatInput";
import { generateResponse } from "@/lib/gemini";
import { ChatMessage } from "./ChatMessage";
import { ChatMessage as ChatMessageType, MessageRole } from "@/types/chat";

type Message = ChatMessageType;

interface ChatProps {
  conversationId?: string;
  onNewChat: () => void;
  onConversationCreated?: (conversationId: string) => void;
}

export function Chat({
  conversationId,
  onNewChat,
  onConversationCreated,
}: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [temporaryChat, setTemporaryChat] = useState(true);

  useEffect(() => {
    if (conversationId) {
      setTemporaryChat(false);
      fetchMessages();
    } else {
      setMessages([]);
      setTemporaryChat(true);
    }
  }, [conversationId]);

  const fetchMessages = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(
        `/api/conversations/${conversationId}/messages`
      );
      const data = await response.json();

      if (data.messages) {
        if (data.messages.length === 0) {
          console.warn("No messages found, retrying...");
          setTimeout(fetchMessages, 1000); // Retry fetching after a delay
        } else {
          setMessages(data.messages);
        }
      }
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    }
  };

  const createNewConversation = async (firstMessage: Message) => {
    try {
      const title =
        firstMessage.content.split("\n")[0].slice(0, 50) +
        (firstMessage.content.length > 50 ? "..." : "");

      const response = await fetch("/api/conversations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          messages: [firstMessage], // Ensuring first message is included
        }),
      });

      const data = await response.json();
      if (data.conversation?._id) {
        setTemporaryChat(false);
        onConversationCreated?.(data.conversation._id);
        return data.conversation._id;
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
    return null;
  };

  const handleSendMessage = async (
    content: string,
    attachments?: { type: "document" | "image"; url: string; name: string }[]
  ) => {
    try {
      setIsLoading(true);

      // Create user message
      const userMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "user",
        content: content || "Attached file for analysis",
        timestamp: Date.now(),
        attachments: attachments ? attachments : undefined,
        email: "user@example.com",
      };

      // Add user message to UI immediately
      setMessages((prev) => [...prev, userMessage]);

      // If this is a temporary chat, create a new conversation with the message
      let currentConversationId = conversationId;
      if (temporaryChat) {
        currentConversationId = await createNewConversation(userMessage);
      } else {
        // Save user message to existing conversation
        await fetch(`/api/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userMessage),
        });
      }

      // Get AI response
      const response = await generateResponse(
        content,
        messages,
        attachments && attachments.length > 0 ? attachments[0] : undefined
      );

      // Create AI message
      const aiMessage: Message = {
        id: Math.random().toString(36).substring(7),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
        email: "ai@chat.com",
      };

      // Add AI message to UI
      setMessages((prev) => [...prev, aiMessage]);

      // Save AI message to database
      if (currentConversationId) {
        await fetch(`/api/conversations/${currentConversationId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(aiMessage),
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto py-6 px-24">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Welcome to CHAT A.I.+
              </h1>
              <p className="text-gray-600 max-w-md">
                Ask me anything! I'm here to help you with your questions and
                tasks.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto">
          <ChatInput onSend={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
