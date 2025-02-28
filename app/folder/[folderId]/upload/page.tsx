"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Upload, File as FileIcon, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";

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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SidebarTrigger className="mr-2" />
          <div>
            <h1 className="text-3xl font-bold">Upload Notes</h1>
            {folder && (
              <p className="text-muted-foreground mt-1">
                Folder: {folder.name}
              </p>
            )}
          </div>
        </div>
      </div>

      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-border"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center gap-4">
          <div className="rounded-full bg-primary/10 p-4">
            <Upload className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">
              Drag and drop your files here
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Support for PDF and text files
            </p>
          </div>
          <div className="mt-2">
            <Button asChild>
              <label htmlFor="file-upload">
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
      </div>

      {/* Active Uploads */}
      {Object.entries(uploads).length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Uploading</h2>
          <div className="space-y-4">
            {Object.entries(uploads).map(([fileName, upload]) => (
              <Card key={fileName}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileIcon className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {(upload.file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {upload.status === "complete" ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : upload.status === "error" ? (
                        <X className="h-5 w-5 text-red-500" />
                      ) : null}
                    </div>
                  </div>
                  <Progress value={upload.progress} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {uploadedFiles.map((file) => (
              <Card key={file._id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileIcon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium">{file.displayName}</p>
                      <p className="text-sm text-muted-foreground">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(file.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
