"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Folder,
  MoreHorizontal,
  Share,
  Trash2,
  Upload,
  BookOpen,
  MessageSquare,
  BrainCircuit,
  ChevronRight,
  Plus,
  Pencil,
  type LucideIcon,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileSelectDialog } from "@/components/file-select-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FolderItem {
  _id: string;
  name: string;
  description: string;
}

interface Instance {
  _id: string;
  name: string;
  type: "chat" | "quiz";
}

export function NavFolders() {
  const { isMobile } = useSidebar();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const folderId = params?.folderId as string;
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [currentFolder, setCurrentFolder] = useState<FolderItem | null>(null);
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isNewQuizOpen, setIsNewQuizOpen] = useState(false);
  const [isFileSelectOpen, setIsFileSelectOpen] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [editingFolder, setEditingFolder] = useState<FolderItem | null>(null);

  useEffect(() => {
    fetchFolders();
  }, []); // Only fetch folders once on mount

  useEffect(() => {
    if (folderId) {
      fetchCurrentFolder();
      fetchInstances();
    }
  }, [folderId]); // Only fetch when folder changes

  const fetchFolders = async () => {
    try {
      const response = await fetch("/api/folders");
      if (!response.ok) throw new Error("Failed to fetch folders");
      const data = await response.json();
      setFolders(data);
    } catch (error) {
      console.error("Error fetching folders:", error);
    }
  };

  const fetchCurrentFolder = async () => {
    try {
      const response = await fetch(`/api/folders/${folderId}`);
      if (!response.ok) throw new Error("Failed to fetch folder");
      const data = await response.json();
      setCurrentFolder(data);
    } catch (error) {
      console.error("Error fetching current folder:", error);
    }
  };

  const fetchInstances = async () => {
    try {
      const response = await fetch(`/api/instances?folderId=${folderId}`);
      if (!response.ok) throw new Error("Failed to fetch instances");
      const data = await response.json();
      setInstances(data);
    } catch (error) {
      console.error("Error fetching instances:", error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this folder?")) return;

    try {
      const response = await fetch(`/api/folders?id=${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete folder");
      setFolders(folders.filter((folder) => folder._id !== id));
      if (id === folderId) {
        router.push("/");
      }
      toast({
        title: "Success",
        description: "Folder deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: "Error",
        description: "Failed to delete folder",
        variant: "destructive",
      });
    }
  };

  const handleRenameFolder = async () => {
    if (!editingFolder) return;

    try {
      const response = await fetch("/api/folders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingFolder._id,
          name: editingFolder.name,
          description: editingFolder.description,
        }),
      });
      if (!response.ok) throw new Error("Failed to rename folder");

      const updatedFolder = await response.json();
      setFolders(
        folders.map((f) => (f._id === updatedFolder._id ? updatedFolder : f))
      );
      if (updatedFolder._id === folderId) {
        setCurrentFolder(updatedFolder);
      }
      setEditingFolder(null);
      toast({
        title: "Success",
        description: "Folder renamed successfully",
      });
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast({
        title: "Error",
        description: "Failed to rename folder",
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
        folderId,
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
      setInstances([...instances, newInstance]);

      if (type === "quiz") {
        // Generate quiz after instance creation
        const quizResponse = await fetch("/api/quizzes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileIds: selectedFileIds,
            folderId,
            instanceId: newInstance._id,
          }),
        });
        if (!quizResponse.ok) throw new Error("Failed to generate quiz");
      }

      setNewInstanceName("");
      setSelectedFileIds([]);
      setIsNewChatOpen(false);
      setIsNewQuizOpen(false);
      setIsFileSelectOpen(false);

      router.push(`/folder/${folderId}/${type}/${newInstance._id}`);
      toast({
        title: "Success",
        description: `${type} created successfully`,
      });
    } catch (error) {
      console.error(`Error creating ${type}:`, error);
      toast({
        title: "Error",
        description: `Failed to create ${type}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteInstance = async (instance: Instance) => {
    if (!confirm(`Are you sure you want to delete this ${instance.type}?`))
      return;

    try {
      const response = await fetch(`/api/instances?id=${instance._id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete instance");
      setInstances(instances.filter((i) => i._id !== instance._id));
      toast({
        title: "Success",
        description: `${instance.type} deleted successfully`,
      });
    } catch (error) {
      console.error("Error deleting instance:", error);
      toast({
        title: "Error",
        description: "Failed to delete instance",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarGroupLabel>Folders</SidebarGroupLabel>
        <SidebarMenu>
          {folders.map((folder) => (
            <SidebarMenuItem key={folder._id}>
              <SidebarMenuButton asChild>
                <a href={`/folder/${folder._id}`}>
                  <Folder className="h-4 w-4" />
                  <span>{folder.name}</span>
                </a>
              </SidebarMenuButton>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction showOnHover>
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">More</span>
                  </SidebarMenuAction>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-48"
                  side={isMobile ? "bottom" : "right"}
                  align={isMobile ? "end" : "start"}
                >
                  <DropdownMenuItem
                    onClick={() => router.push(`/folder/${folder._id}`)}
                  >
                    <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>View Folder</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setEditingFolder(folder)}>
                    <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Rename Folder</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleDelete(folder._id)}>
                    <Trash2 className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Delete Folder</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        {folderId && currentFolder && (
          <div className="mt-4">
            <SidebarGroupLabel>Folder Navigation</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href={`/folder/${folderId}/upload`}>
                    <Upload className="h-4 w-4" />
                    <span>Upload</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <a href={`/folder/${folderId}/summary`}>
                    <BookOpen className="h-4 w-4" />
                    <span>Summary</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <Collapsible>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <MessageSquare className="h-4 w-4" />
                    <span>Chat</span>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction>
                      <ChevronRight className="h-4 w-4" />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {instances
                        .filter((instance) => instance.type === "chat")
                        .map((chat) => (
                          <SidebarMenuSubItem key={chat._id}>
                            <SidebarMenuSubButton asChild>
                              <a href={`/folder/${folderId}/chat/${chat._id}`}>
                                <span>{chat.name}</span>
                              </a>
                            </SidebarMenuSubButton>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuAction showOnHover>
                                  <MoreHorizontal className="h-4 w-4" />
                                </SidebarMenuAction>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                side={isMobile ? "bottom" : "right"}
                                align="start"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleDeleteInstance(chat)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Chat
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuSubItem>
                        ))}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => setIsNewChatOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <span>New Chat</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>

              <Collapsible>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <BrainCircuit className="h-4 w-4" />
                    <span>Quiz</span>
                  </SidebarMenuButton>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction>
                      <ChevronRight className="h-4 w-4" />
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {instances
                        .filter((instance) => instance.type === "quiz")
                        .map((quiz) => (
                          <SidebarMenuSubItem key={quiz._id}>
                            <SidebarMenuSubButton asChild>
                              <a href={`/folder/${folderId}/quiz/${quiz._id}`}>
                                <span>{quiz.name}</span>
                              </a>
                            </SidebarMenuSubButton>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <SidebarMenuAction showOnHover>
                                  <MoreHorizontal className="h-4 w-4" />
                                </SidebarMenuAction>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                side={isMobile ? "bottom" : "right"}
                                align="start"
                              >
                                <DropdownMenuItem
                                  onClick={() => handleDeleteInstance(quiz)}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Quiz
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </SidebarMenuSubItem>
                        ))}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          onClick={() => setIsNewQuizOpen(true)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          <span>New Quiz</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </div>
        )}
      </SidebarGroup>

      {/* New Chat Dialog */}
      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
            <DialogDescription>
              Enter a name for your new chat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Enter chat name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewChatOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateInstance("chat")}
              disabled={!newInstanceName.trim()}
            >
              Create Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Quiz Dialog */}
      <Dialog open={isNewQuizOpen} onOpenChange={setIsNewQuizOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Quiz</DialogTitle>
            <DialogDescription>
              Enter a name for your new quiz and select files.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                placeholder="Enter quiz name"
              />
            </div>
            <Button variant="outline" onClick={() => setIsFileSelectOpen(true)}>
              Select Files
            </Button>
            {selectedFileIds.length > 0 && (
              <p className="text-sm text-muted-foreground">
                {selectedFileIds.length} files selected
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsNewQuizOpen(false);
                setNewInstanceName("");
                setSelectedFileIds([]);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => handleCreateInstance("quiz")}
              disabled={!newInstanceName.trim() || selectedFileIds.length === 0}
            >
              Create Quiz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* File Select Dialog */}
      <FileSelectDialog
        open={isFileSelectOpen}
        onClose={() => setIsFileSelectOpen(false)}
        onSelect={(fileIds) => {
          setSelectedFileIds(fileIds);
          setIsFileSelectOpen(false);
        }}
        folderId={folderId}
      />

      {/* Rename Folder Dialog */}
      <Dialog
        open={!!editingFolder}
        onOpenChange={(open) => !open && setEditingFolder(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
            <DialogDescription>
              Enter a new name for your folder.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="folderName">Name</Label>
              <Input
                id="folderName"
                value={editingFolder?.name || ""}
                onChange={(e) =>
                  setEditingFolder(
                    editingFolder
                      ? { ...editingFolder, name: e.target.value }
                      : null
                  )
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="folderDescription">Description</Label>
              <Input
                id="folderDescription"
                value={editingFolder?.description || ""}
                onChange={(e) =>
                  setEditingFolder(
                    editingFolder
                      ? { ...editingFolder, description: e.target.value }
                      : null
                  )
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingFolder(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleRenameFolder}
              disabled={!editingFolder?.name.trim()}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
