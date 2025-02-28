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
import { Pencil, Trash2, Plus } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";

type Folder = {
  _id: string;
  name: string;
  description: string;
};

export function FolderList() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
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
    setEditingId(folder._id);
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
      setEditingId(null);
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
      <Button onClick={() => setIsCreating(true)} className="mb-4">
        <Plus className="h-4 w-4 mr-2" />
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
          <Card key={folder._id}>
            {editingId === folder._id ? (
              <CardContent className="pt-6">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mb-2"
                  placeholder="Folder name"
                />
                <Input
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mb-4"
                  placeholder="Description"
                />
                <Button
                  onClick={() => handleSave(folder._id)}
                  className="mr-2"
                  disabled={!editName}
                >
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditingId(null)}>
                  Cancel
                </Button>
              </CardContent>
            ) : (
              <>
                <CardHeader>
                  <CardTitle>{folder.name}</CardTitle>
                  <CardDescription>{folder.description}</CardDescription>
                </CardHeader>
                <CardFooter className="justify-between">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleEdit(folder)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleDelete(folder._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button asChild>
                    <Link href={`/folder/${folder._id}`}>Open</Link>
                  </Button>
                </CardFooter>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
