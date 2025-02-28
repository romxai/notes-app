"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { PaperclipIcon } from "lucide-react";

interface FileUploadProps {
  onUpload: (file: File) => void;
  disabled?: boolean;
  accept?: string;
}

export function FileUpload({
  onUpload,
  disabled = false,
  accept = ".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png",
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        className="hidden"
        disabled={disabled}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleClick}
        disabled={disabled}
        className="text-gray-400 hover:text-gray-600"
      >
        <PaperclipIcon className="h-5 w-5" />
      </Button>
    </>
  );
}
