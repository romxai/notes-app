"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, FolderOpen, FolderPlus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { MagicCard } from "@/components/magicui/magic-card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

type Folder = {
  _id: string;
  name: string;
  description: string;
};

export function FolderList() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [newFolderDescription, setNewFolderDescription] = useState("");
  const { toast } = useToast();

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setFolders(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch folders",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  // Create folder
  const handleCreate = async () => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newFolderName,
          description: newFolderDescription,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFolders([data, ...folders]);
      setIsCreating(false);
      setNewFolderName("");
      setNewFolderDescription("");
      toast({
        title: "Success",
        description: "Folder created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create folder",
        variant: "destructive",
      });
    }
  };

  // Edit folder
  const handleEdit = (folder: Folder) => {
    setEditingFolder(folder);
    setEditName(folder.name);
    setEditDescription(folder.description);
  };

  const handleSave = async (id: string) => {
    try {
      const response = await fetch("/api/folders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          name: editName,
          description: editDescription,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFolders(folders.map((folder) => (folder._id === id ? data : folder)));
      setEditingFolder(null);
      toast({
        title: "Success",
        description: "Folder updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update folder",
        variant: "destructive",
      });
    }
  };

  // Delete folder
  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this folder? This will also delete all items inside it."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/folders?id=${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setFolders(folders.filter((folder) => folder._id !== id));
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={() => setIsCreating(true)}
        className="mb-4"
        variant="outline"
        className="bg-accent text-accent-foreground hover:bg-accent/90"
      >
        <FolderPlus className="mr-2 h-4 w-4" />
        New Folder
      </Button>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {isCreating && (
          <Card>
            <CardContent className="pt-6">
              <Input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="mb-2"
                placeholder="Folder name"
              />
              <Input
                value={newFolderDescription}
                onChange={(e) => setNewFolderDescription(e.target.value)}
                className="mb-4"
                placeholder="Description"
              />
              <Button
                onClick={handleCreate}
                className="mr-2"
                disabled={!newFolderName}
              >
                Create
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </CardContent>
          </Card>
        )}

        {folders.map((folder) => (
          <MagicCard
            key={folder._id}
            className="rounded-xl"
            gradientFrom="hsl(var(--accent))"
            gradientTo="hsl(var(--gradend))"
            gradientSize={400}
            gradientOpacity={0.5}
          >
            <div className="relative p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-primary mb-2">
                    {folder.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {folder.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(folder)}
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(folder._id)}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
              <Button
                asChild
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <Link href={`/folder/${folder._id}`}>
                  <FolderOpen className="mr-2 h-4 w-4" />
                  Open Folder
                </Link>
              </Button>
            </div>
          </MagicCard>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog
        open={editingFolder !== null}
        onOpenChange={() => setEditingFolder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => editingFolder && handleSave(editingFolder._id)}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
