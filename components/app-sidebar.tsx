"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookText,
  FileUp,
  FlaskConical,
  MessageSquare,
  ScrollText,
  ChevronDown,
  Plus,
  Home,
  Trash2,
  LogOut,
  User,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FileSelectDialog } from "@/components/file-select-dialog";

type Instance = {
  _id: string;
  name: string;
  type: "chat" | "quiz" | "flashcard";
  folderId: string;
};

type InstanceGroup = {
  title: string;
  icon: any;
  type: string;
  items: Instance[];
};

type UserInfo = {
  username: string;
  email: string;
};

interface Folder {
  _id: string;
  name: string;
  description: string;
}

const navItems = [
  {
    title: "Upload",
    icon: FileUp,
    href: "/upload",
  },
  {
    title: "Summary",
    icon: ScrollText,
    href: "/summary",
  },
];

export function AppSidebar({ folderId }: { folderId?: string }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [user, setUser] = useState<UserInfo | null>(null);
  const [folder, setFolder] = useState<Folder | null>(null);
  const [fileSelectOpen, setFileSelectOpen] = useState(false);
  const [pendingQuizCreate, setPendingQuizCreate] = useState(false);

  useEffect(() => {
    if (folderId) {
      fetchInstances();
      fetchFolder();
    }
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

  const instanceGroups: InstanceGroup[] = [
    {
      title: "Chat",
      icon: MessageSquare,
      type: "chat",
      items: instances.filter((i) => i.type === "chat"),
    },
    {
      title: "Flash Cards",
      icon: BookText,
      type: "flashcard",
      items: instances.filter((i) => i.type === "flashcard"),
    },
    {
      title: "Quiz",
      icon: FlaskConical,
      type: "quiz",
      items: instances.filter((i) => i.type === "quiz"),
    },
  ];

  // Fetch instances for the current folder
  const fetchInstances = async () => {
    if (!folderId) return;
    try {
      const response = await fetch(`/api/instances?folderId=${folderId}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setInstances(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch instances",
        variant: "destructive",
      });
    }
  };

  // Update handleFileSelect to handle multiple files
  const handleFileSelect = async (fileIds: string[]) => {
    console.log("Selected files for quiz:", fileIds);
    try {
      // Create quiz instance
      console.log("Creating quiz instance...");
      const instanceResponse = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newInstanceName || `Quiz ${instances.length + 1}`,
          type: "quiz",
          folderId,
          fileIds, // Pass array of file IDs
        }),
      });

      if (!instanceResponse.ok) {
        throw new Error("Failed to create quiz instance");
      }

      const instance = await instanceResponse.json();
      console.log("Quiz instance created:", instance);

      // Generate quiz for the instance
      console.log("Generating quiz...");
      const quizResponse = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileIds,
          folderId,
          instanceId: instance._id,
        }),
      });

      if (!quizResponse.ok) {
        throw new Error("Failed to generate quiz");
      }

      const quiz = await quizResponse.json();
      console.log("Quiz generated successfully:", quiz);

      setInstances([instance, ...instances]);
      setFileSelectOpen(false);
      setNewInstanceName("");
      setPendingQuizCreate(false);

      // Navigate to the quiz page
      router.push(`/folder/${folderId}/quiz/${instance._id}`);
    } catch (error) {
      console.error("Error creating quiz:", error);
      toast({
        title: "Error",
        description: "Failed to create quiz",
        variant: "destructive",
      });
    }
  };

  // Update handleCreateInstance
  const handleCreateInstance = async (type: string) => {
    console.log("Creating instance of type:", type);
    try {
      if (type === "quiz") {
        console.log("Opening file selection dialog for quiz");
        setPendingQuizCreate(true);
        setFileSelectOpen(true);
        return;
      }

      // Existing instance creation logic for other types
      const response = await fetch("/api/instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newInstanceName || `${type} ${instances.length + 1}`,
          type,
          folderId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create instance");
      }

      const instance = await response.json();
      console.log("Instance created:", instance);

      setInstances([instance, ...instances]);
      setIsCreating(false);
      setNewInstanceName("");

      toast({
        title: "Success",
        description: `${type} created successfully`,
      });
    } catch (error) {
      console.error("Error creating instance:", error);
      toast({
        title: "Error",
        description: "Failed to create instance",
        variant: "destructive",
      });
    }
  };

  // Delete instance
  const handleDeleteInstance = async (instance: Instance) => {
    if (!confirm(`Are you sure you want to delete this ${instance.type}?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/instances?id=${instance._id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setInstances(instances.filter((i) => i._id !== instance._id));
      toast({
        title: "Success",
        description: `${instance.type} deleted successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete instance",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const data = await response.json();
          setUser(data);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  return (
    <>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 px-4 py-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary">
              <BookText className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="font-semibold">
              <h2 className="text-sm font-semibold">STUDY +</h2>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupLabel>
              {" "}
              {folder ? (
                <h2 className="text-sm font-semibold">{folder.name}</h2>
              ) : (
                <div className="h-5 w-24 animate-pulse rounded bg-muted"></div>
              )}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link href="/">
                      <Home className="h-4 w-4" />
                      <span>Home</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {folderId &&
                  navItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={
                          pathname === `/folder/${folderId}${item.href}`
                        }
                      >
                        <Link href={`/folder/${folderId}${item.href}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                {folderId &&
                  instanceGroups.map((group) => (
                    <Collapsible key={group.title}>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton className="w-full justify-between">
                          <div className="flex items-center">
                            <group.icon className="h-4 w-4 mr-2" />
                            <span>{group.title}</span>
                          </div>
                          <ChevronDown className="h-4 w-4" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="pl-6 py-2 space-y-2">
                          {group.items.map((instance) => (
                            <div
                              key={instance._id}
                              className="flex items-center justify-between group"
                            >
                              <Link
                                href={`/folder/${folderId}/${group.type}/${instance._id}`}
                                className="flex-1 py-1 px-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                              >
                                {instance.name}
                              </Link>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="opacity-0 group-hover:opacity-100"
                                onClick={() => handleDeleteInstance(instance)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          ))}
                          <Dialog
                            open={isCreating && selectedType === group.type}
                            onOpenChange={(open) => {
                              if (!open) {
                                setIsCreating(false);
                                setSelectedType("");
                                setNewInstanceName("");
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => {
                                  setIsCreating(true);
                                  setSelectedType(group.type);
                                }}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                New {group.title}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  Create New {group.title}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <Input
                                  value={newInstanceName}
                                  onChange={(e) =>
                                    setNewInstanceName(e.target.value)
                                  }
                                  placeholder={`Enter ${group.title.toLowerCase()} name`}
                                />
                                <Button
                                  onClick={() =>
                                    handleCreateInstance(group.type)
                                  }
                                  disabled={!newInstanceName}
                                  className="w-full"
                                >
                                  Create
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
        <div className="mt-auto border-t">
          {user && (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
                  <User className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-medium">{user.username}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          )}
        </div>
      </Sidebar>
      <FileSelectDialog
        open={fileSelectOpen}
        onClose={() => {
          setFileSelectOpen(false);
          setPendingQuizCreate(false);
        }}
        onSelect={handleFileSelect}
        folderId={folderId || ""}
      />
    </>
  );
}
