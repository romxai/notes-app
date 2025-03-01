"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Upload, File as FileIcon, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { MagicCard } from "@/components/magicui/magic-card";
import { cn } from "@/lib/utils";

interface FileUpload {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "complete" | "error";
}

interface UploadedFile {
  _id: string;
  displayName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
}

interface Folder {
  _id: string;
  name: string;
  description: string;
}

export default function UploadPage() {
  const { folderId } = useParams();
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<Record<string, FileUpload>>({});
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [folder, setFolder] = useState<Folder | null>(null);

  useEffect(() => {
    fetchFolder();
    fetchFiles();
  }, [folderId]);

  const fetchFolder = async () => {
    try {
      console.log("Fetching folder details for:", folderId);
      const response = await fetch(`/api/folders/${folderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch folder");
      }
      const data = await response.json();
      console.log("Folder data:", data);
      setFolder(data);
    } catch (error) {
      console.error("Error fetching folder:", error);
      toast({
        title: "Error",
        description: "Failed to fetch folder details",
        variant: "destructive",
      });
    }
  };

  const fetchFiles = async () => {
    try {
      const response = await fetch(`/api/files?folderId=${folderId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUploadedFiles(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch uploaded files",
        variant: "destructive",
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      handleFiles(selectedFiles);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      // Add file to uploads state
      setUploads((prev) => ({
        ...prev,
        [file.name]: {
          file,
          progress: 0,
          status: "uploading",
        },
      }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folderId", folderId as string);

        const response = await fetch("/api/files", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error);

        setUploads((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            progress: 100,
            status: "complete",
          },
        }));

        // Update uploaded files list
        setUploadedFiles((prev) => [data, ...prev]);

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        });
      } catch (error) {
        setUploads((prev) => ({
          ...prev,
          [file.name]: {
            ...prev[file.name],
            status: "error",
          },
        }));

        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Sticky Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 w-full items-center">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-bold pl-8 text-primary">
                Upload Notes
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="container max-w-screen-2xl space-y-8 p-6">
          {/* Upload Area */}
          <MagicCard className="relative overflow-hidden">
            <div
              className={cn(
                "flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-12 text-center transition-colors",
                isDragging
                  ? "border-primary bg-primary/5"
                  : "border-muted hover:border-primary/50"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="rounded-full bg-primary/10 p-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-primary">
                  Drag and drop your files here
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Support for PDF and text files
                </p>
              </div>
              <div className="mt-2">
                <Button className="bg-accent" variant="outline" asChild>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Select Files
                    <input
                      id="file-upload"
                      type="file"
                      className="sr-only"
                      multiple
                      accept=".pdf,.txt,.doc,.docx"
                      onChange={handleFileChange}
                    />
                  </label>
                </Button>
              </div>
            </div>
          </MagicCard>

          {/* Active Uploads */}
          {Object.entries(uploads).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Uploading</h2>
              <div className="grid gap-4">
                {Object.entries(uploads).map(([fileName, upload]) => (
                  <Card key={fileName} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="rounded-full bg-primary/10 p-2">
                            <FileIcon className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium truncate">{fileName}</p>
                            <p className="text-sm text-muted-foreground">
                              {(upload.file.size / 1024).toFixed(2)} KB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {upload.status === "complete" ? (
                            <div className="rounded-full bg-green-500/10 p-1">
                              <Check className="h-4 w-4 text-green-500" />
                            </div>
                          ) : upload.status === "error" ? (
                            <div className="rounded-full bg-destructive/10 p-1">
                              <X className="h-4 w-4 text-destructive" />
                            </div>
                          ) : null}
                        </div>
                      </div>
                      <Progress
                        value={upload.progress}
                        className={cn(
                          "mt-3",
                          upload.status === "complete" &&
                            "[&>div]:bg-green-500",
                          upload.status === "error" && "[&>div]:bg-destructive"
                        )}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-primary">
                Uploaded Files
              </h2>
              <div className="grid rounded-lg gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {uploadedFiles.map((file) => (
                  <MagicCard key={file._id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-full bg-primary/10 p-2 mt-1">
                          <FileIcon className="h-4 w-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-primary">
                            {file.displayName}
                          </p>
                          <p className="text-sm text-muted">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                          <p className="text-xs text-muted">
                            {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </MagicCard>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
