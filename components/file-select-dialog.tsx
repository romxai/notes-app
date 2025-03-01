import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface File {
  _id: string;
  displayName: string;
  mimeType: string;
}

interface FileSelectDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (fileIds: string[]) => void;
  folderId: string;
}

export function FileSelectDialog({
  open,
  onClose,
  onSelect,
  folderId,
}: FileSelectDialogProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (open) {
      fetchFiles();
      setSelectedFiles(new Set());
    }
  }, [open, folderId]);

  const fetchFiles = async () => {
    try {
      console.log("Fetching files for folder:", folderId);
      const response = await fetch(`/api/files?folderId=${folderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch files");
      }

      console.log("Files fetched successfully:", data);
      setFiles(data);
    } catch (error) {
      console.error("Error fetching files:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const toggleAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(file => file._id)));
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selectedFiles));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Select Files for Quiz</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="py-4">Loading files...</div>
        ) : files.length === 0 ? (
          <div className="py-4">No files available. Please upload files first.</div>
        ) : (
          <>
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleAll}
                className="w-full"
              >
                {selectedFiles.size === files.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {files.map((file) => (
                  <div
                    key={file._id}
                    className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md"
                  >
                    <Checkbox
                      checked={selectedFiles.has(file._id)}
                      onCheckedChange={() => toggleFile(file._id)}
                      id={file._id}
                    />
                    <label
                      htmlFor={file._id}
                      className="flex-1 flex items-center space-x-2 cursor-pointer"
                    >
                      <FileText className="h-4 w-4" />
                      <span>{file.displayName}</span>
                    </label>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <DialogFooter>
              <Button
                onClick={handleConfirm}
                disabled={selectedFiles.size === 0}
                className="w-full"
              >
                Generate Quiz ({selectedFiles.size} files selected)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
