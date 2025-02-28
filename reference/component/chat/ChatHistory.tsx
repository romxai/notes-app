"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Trash2,
  MessageSquare,
  PlusCircle,
  Settings,
  LogOut,
  User,
  Edit2,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

interface Conversation {
  _id: string;
  title: string;
  updatedAt: string;
}

interface ChatHistoryProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  user: any;
  onLogout: () => Promise<void>;
  onSelectConversation: (conversationId: string) => void;
  selectedConversationId?: string;
  isTemporaryChat: boolean;
}

export function ChatHistory({
  isCollapsed,
  onToggleCollapse,
  user,
  onLogout,
  onSelectConversation,
  selectedConversationId,
  isTemporaryChat,
}: ChatHistoryProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const editInputRef = useRef<HTMLInputElement>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const response = await fetch("/api/conversations");
      const data = await response.json();
      if (data.conversations) {
        setConversations(
          data.conversations.sort(
            (a: Conversation, b: Conversation) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );
      }
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingId]);

  const handleNewChat = () => {
    onSelectConversation("");
  };

  const handleDeleteChat = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setConversations((prev) =>
          prev.filter((conv) => conv._id !== conversationId)
        );
        if (selectedConversationId === conversationId) {
          onSelectConversation("");
        }
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const startEditing = (conversation: Conversation) => {
    setEditingId(conversation._id);
    setEditTitle(conversation.title);
  };

  const handleRename = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title: editTitle }),
      });

      if (response.ok) {
        setConversations((prev) =>
          prev.map((conv) =>
            conv._id === conversationId
              ? {
                  ...conv,
                  title: editTitle,
                  updatedAt: new Date().toISOString(),
                }
              : conv
          )
        );
      }
    } catch (error) {
      console.error("Failed to rename chat:", error);
    } finally {
      setEditingId(null);
    }
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditTitle("");
  };

  // Add a new conversation to the list
  const addConversation = (conversation: Conversation) => {
    setConversations((prev) => [conversation, ...prev]);
  };

  // Update a conversation in the list
  const updateConversation = (
    conversationId: string,
    updates: Partial<Conversation>
  ) => {
    setConversations((prev) =>
      prev.map((conv) =>
        conv._id === conversationId
          ? { ...conv, ...updates, updatedAt: new Date().toISOString() }
          : conv
      )
    );
  };

  return (
    <aside
      className={`bg-gray-100 shadow-lg ${
        isCollapsed ? "w-16" : "w-72"
      } transition-all duration-300 ease-in-out flex flex-col`}
    >
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-800">CHAT A.I.+</h2>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="ml-auto shrink-0"
        >
          {isCollapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {!isCollapsed && (
          <div className="p-4">
            <Button
              variant="default"
              className="w-full justify-start gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
              onClick={handleNewChat}
            >
              <PlusCircle className="h-4 w-4" />
              New chat
            </Button>
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-500">
                Your conversations
              </h3>
              <ul className="mt-2 space-y-2">
                {isTemporaryChat && selectedConversationId === "" && (
                  <li className="flex items-center justify-between rounded-lg p-2 bg-gray-200">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      <span className="truncate">New Chat</span>
                    </div>
                  </li>
                )}
                {conversations.map((chat) => (
                  <li
                    key={chat._id}
                    className={`flex items-center justify-between rounded-lg p-2 hover:bg-gray-200 cursor-pointer group ${
                      selectedConversationId === chat._id ? "bg-gray-200" : ""
                    }`}
                    onClick={() => !editingId && onSelectConversation(chat._id)}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      {editingId === chat._id ? (
                        <div className="flex items-center gap-1 flex-1">
                          <Input
                            ref={editInputRef}
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            className="h-6 text-sm"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                handleRename(chat._id);
                              } else if (e.key === "Escape") {
                                cancelEditing();
                              }
                            }}
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleRename(chat._id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={cancelEditing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <span className="truncate">{chat.title}</span>
                      )}
                    </div>
                    {!editingId && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500"
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(chat);
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteChat(chat._id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          <Separator />
          <div className="p-4">
            <div className="flex items-center gap-4">
              <Avatar>
                <AvatarImage src="" />
                <AvatarFallback>
                  {user?.email?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {user.email}
                </p>
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
