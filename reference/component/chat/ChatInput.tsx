"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileUpload } from "./FileUpload";

interface ChatInputProps {
  onSend: (
    content: string,
    attachments?: { type: "document" | "image"; url: string; name: string }[]
  ) => Promise<void>;
  isLoading: boolean;
}

interface UploadProgress {
  fileName: string;
  progress: number;
  status: string;
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [content, setContent] = useState("");
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const progressCheckInterval = useRef<NodeJS.Timeout>();

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (progressCheckInterval.current) {
        clearInterval(progressCheckInterval.current);
      }
    };
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() && !uploadProgress) return;

    try {
      await onSend(content, []);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const checkProgress = async (processId: string) => {
    try {
      const response = await fetch(
        `/api/process-large-file?processId=${processId}`
      );
      if (!response.ok) throw new Error("Failed to fetch progress");

      const progress = await response.json();
      setUploadProgress({
        fileName: uploadProgress?.fileName || "",
        progress: progress.progress,
        status: progress.message,
      });

      if (progress.status === "complete" || progress.status === "error") {
        if (progressCheckInterval.current) {
          clearInterval(progressCheckInterval.current);
        }
      }
    } catch (error) {
      console.error("Error checking progress:", error);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      // Check if file is larger than 10MB
      if (file.size > 10 * 1024 * 1024) {
        const processId = Math.random().toString(36).substring(7);
        setUploadProgress({
          fileName: file.name,
          progress: 0,
          status: "Starting upload...",
        });

        // Start progress checking
        progressCheckInterval.current = setInterval(
          () => checkProgress(processId),
          1000
        );

        // Prepare form data
        const formData = new FormData();
        formData.append("file", file);
        formData.append("processId", processId);

        // Send to server for processing
        const response = await fetch("/api/process-large-file", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Processing failed");
        }

        const { text, analysis, fileName } = await response.json();

        // Clear progress checking
        if (progressCheckInterval.current) {
          clearInterval(progressCheckInterval.current);
        }

        // Send both the original text and analysis to chat
        await onSend(`Processed content from ${fileName}:\n\n${analysis}`, [
          {
            type: "document",
            url: "#",
            name: fileName,
          },
        ]);

        setUploadProgress(null);
      } else {
        // For smaller files, use existing Cloudinary upload
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const data = await response.json();

        await onSend(content || "Uploaded file for analysis:", [
          {
            type: file.type.startsWith("image/") ? "image" : "document",
            url: data.url,
            name: file.name,
          },
        ]);

        setContent("");
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadProgress(null);
      // Clear progress checking if there was an error
      if (progressCheckInterval.current) {
        clearInterval(progressCheckInterval.current);
      }
    }
  };

  return (
    <div className="p-4">
      {uploadProgress && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">
              {uploadProgress.fileName}
            </span>
            <span className="text-sm">
              {Math.round(uploadProgress.progress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress.progress}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">{uploadProgress.status}</p>
        </div>
      )}

      <div className="relative">
        <Textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = e.target.scrollHeight + "px";
          }}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-[60px] w-full resize-none rounded-2xl border-0 bg-slate-100 p-4 pr-20 focus:ring-0 focus-visible:ring-0 md:min-h-[80px]"
          disabled={isLoading}
        />
        <div className="absolute bottom-4 right-4 flex items-center gap-2">
          <FileUpload onUpload={handleFileUpload} disabled={isLoading} />
          <Button
            onClick={handleSubmit}
            disabled={(!content.trim() && !uploadProgress) || isLoading}
            className="h-8 w-8 rounded-lg bg-blue-500 p-0 hover:bg-blue-600"
          >
            <svg
              className="h-4 w-4 rotate-90 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}
