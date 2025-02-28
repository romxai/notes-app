"use client"

import type React from "react"

import { useState } from "react"
import { Upload, File, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { SidebarTrigger } from "@/components/ui/sidebar"

export default function UploadPage() {
  const [isDragging, setIsDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }

  const addFiles = (newFiles: File[]) => {
    // Filter for PDFs and text files
    const validFiles = newFiles.filter((file) => file.type === "application/pdf" || file.type === "text/plain")

    setFiles((prev) => [...prev, ...validFiles])

    // Initialize progress for each file
    validFiles.forEach((file) => {
      setUploadProgress((prev) => ({
        ...prev,
        [file.name]: 0,
      }))

      // Simulate upload progress
      simulateUpload(file.name)
    })
  }

  const simulateUpload = (fileName: string) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 10
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
      }

      setUploadProgress((prev) => ({
        ...prev,
        [fileName]: progress,
      }))
    }, 300)
  }

  const removeFile = (fileName: string) => {
    setFiles((prev) => prev.filter((file) => file.name !== fileName))
    setUploadProgress((prev) => {
      const newProgress = { ...prev }
      delete newProgress[fileName]
      return newProgress
    })
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-3xl font-bold">Upload Notes</h1>
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
            <h3 className="text-lg font-medium">Drag and drop your files here</h3>
            <p className="text-sm text-muted-foreground mt-1">Support for PDF and text files</p>
          </div>
          <div className="mt-2">
            <label htmlFor="file-upload">
              <Button as="span">Select Files</Button>
              <input
                id="file-upload"
                type="file"
                className="sr-only"
                multiple
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Uploaded Files</h2>
          <div className="space-y-4">
            {files.map((file) => (
              <Card key={file.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <File className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadProgress[file.name] === 100 ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <Button variant="ghost" size="icon" onClick={() => removeFile(file.name)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Progress value={uploadProgress[file.name]} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

