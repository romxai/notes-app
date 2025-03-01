"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSelectDialog } from "@/components/file-select-dialog";
import { MagicCard } from "@/components/magicui/magic-card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface Instance {
  _id: string;
  name: string;
  type: "chat" | "quiz";
}

export default function FolderPage({
  params,
}: {
  params: { folderId: string };
}) {
  const { toast } = useToast();
  const [folderName, setFolderName] = useState("");
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isCreating, setIsCreating] = useState<"chat" | "quiz" | null>(null);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [isFileSelectOpen, setIsFileSelectOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);

  useEffect(() => {
    fetchFolder();
    fetchInstances();
  }, [params.folderId]);

  const fetchFolder = async () => {
    try {
      const response = await fetch(`/api/folders/${params.folderId}`);
      if (!response.ok) throw new Error("Failed to fetch folder");
      const folderData = await response.json();
      setFolderName(folderData.name);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch folder details",
        variant: "destructive",
      });
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await fetch(
        `/api/instances?folderId=${params.folderId}`
      );
      if (!response.ok) throw new Error("Failed to fetch instances");
      const data = await response.json();
      setInstances(data);
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to fetch instances",
        variant: "destructive",
      });
    }
  };

  const handleCreateInstance = async (type: "chat" | "quiz") => {
    try {
      if (!newInstanceName.trim()) {
        toast({
          title: "Error",
          description: "Please enter a name",
          variant: "destructive",
        });
        return;
      }

      const body: any = {
        name: newInstanceName,
        type,
        folderId: params.folderId,
      };

      if (type === "quiz") {
        if (selectedFileIds.length === 0) {
          toast({
            title: "Error",
            description: "Please select at least one file",
            variant: "destructive",
          });
          return;
        }
        body.fileIds = selectedFileIds;
      }

      const response = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(`Failed to create ${type}`);
      const newInstance = await response.json();

      if (type === "quiz") {
        // Generate quiz after instance creation
        const quizResponse = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileIds: selectedFileIds,
            folderId: params.folderId,
            instanceId: newInstance._id,
          }),
        });
        if (!quizResponse.ok) throw new Error("Failed to generate quiz");
      }

      setInstances([...instances, newInstance]);
      setIsCreating(null);
      setNewInstanceName("");
      setSelectedFileIds([]);

      // Redirect to the new instance
      window.location.href = `/folder/${params.folderId}/${type}/${newInstance._id}`;
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: `Failed to create ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleFileSelect = (fileIds: string[]) => {
    setSelectedFileIds(fileIds);
    setIsFileSelectOpen(false);
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-4xl font-bold text-primary">{folderName}</h1>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-2">
        <MagicCard
          className="rounded-xl"
          gradientFrom="hsl(var(--accent))"
          gradientTo="hsl(var(--gradend))"
          gradientSize={400}
          gradientOpacity={0.5}
        >
          <div className="relative p-6 py-12 space-y-4">
            <h3 className="text-xl font-semibold text-primary">Upload Notes</h3>
            <p className="text-muted-foreground">
              Add new study materials to this folder.
            </p>
            <Button
              asChild
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href={`/folder/${params.folderId}/upload`}>
                Go to Upload
              </Link>
            </Button>
          </div>
        </MagicCard>

        <MagicCard
          className="rounded-xl"
          gradientFrom="hsl(var(--accent))"
          gradientTo="hsl(var(--gradend))"
          gradientSize={400}
          gradientOpacity={0.5}
        >
          <div className="relative p-6 py-12 space-y-4">
            <h3 className="text-xl font-semibold text-primary">
              View Summaries
            </h3>
            <p className="text-muted-foreground">
              Access AI-generated summaries of your uploaded notes.
            </p>
            <Button
              asChild
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
            >
              <Link href={`/folder/${params.folderId}/summary`}>
                View Summaries
              </Link>
            </Button>
          </div>
        </MagicCard>

        <MagicCard
          className="rounded-xl"
          gradientFrom="hsl(var(--accent))"
          gradientTo="hsl(var(--gradend))"
          gradientSize={400}
          gradientOpacity={0.5}
        >
          <div className="relative p-6 py-12 space-y-4">
            <h3 className="text-xl font-semibold text-primary">Chat</h3>
            <p className="text-muted-foreground">
              Start a new chat or continue an existing conversation.
            </p>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setIsCreating("chat")}
            >
              Start New Chat
            </Button>
          </div>
        </MagicCard>

        <MagicCard
          className="rounded-xl"
          gradientFrom="hsl(var(--accent))"
          gradientTo="hsl(var(--gradend))"
          gradientSize={400}
          gradientOpacity={0.5}
        >
          <div className="relative p-6 py-12 space-y-4">
            <h3 className="text-xl font-semibold text-primary">Quiz</h3>
            <p className="text-muted-foreground">
              Take quizzes generated from your study materials.
            </p>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              onClick={() => setIsCreating("quiz")}
            >
              Create New Quiz
            </Button>
          </div>
        </MagicCard>
      </div>

      {/* Create Instance Dialog */}
      <Dialog
        open={isCreating !== null}
        onOpenChange={() => setIsCreating(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Create New {isCreating === "chat" ? "Chat" : "Quiz"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder={`Enter ${
                  isCreating === "chat" ? "chat" : "quiz"
                } name`}
              />
            </div>
            {isCreating === "quiz" && (
              <div className="space-y-2">
                <Label>Files</Label>
                <Button
                  variant="outline"
                  onClick={() => setIsFileSelectOpen(true)}
                  className="w-full"
                >
                  {selectedFileIds.length
                    ? `${selectedFileIds.length} files selected`
                    : "Select Files"}
                </Button>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreating(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => isCreating && handleCreateInstance(isCreating)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Select Dialog */}
      <FileSelectDialog
        open={isFileSelectOpen}
        onClose={() => setIsFileSelectOpen(false)}
        onSelect={handleFileSelect}
        folderId={params.folderId}
      />
    </div>
  );
}
