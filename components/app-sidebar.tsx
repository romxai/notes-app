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
  BookOpen,
  Command,
  FileText,
  Folder,
  LifeBuoy,
  Send,
  Settings,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { NavMain } from "@/components/nav-main";
import { NavFolders } from "@/components/nav-folders";
import { NavUser } from "@/components/nav-user";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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
import { ThemeToggle } from "@/components/theme-toggle";

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

interface Folder {
  _id: string;
  name: string;
  description: string;
}

interface UserInfo {
  username: string;
  email: string;
}

export function AppSidebar({ folderId }: { folderId?: string }) {
  const pathname = usePathname();
  const { toast } = useToast();
  const router = useRouter();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
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
        if (!response.ok) throw new Error("Failed to fetch user info");
        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error("Error fetching user info:", error);
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

  const MainNavItems = [
    {
      title: "Files",
      url: "/",
      icon: FileText,
      isActive: !folderId,
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpen,
      items: [
        {
          title: "Getting Started",
          url: "#",
        },
        {
          title: "Tutorials",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      items: [
        {
          title: "General",
          url: "#",
        },
        {
          title: "Security",
          url: "#",
        },
      ],
    },
  ];

  const secondaryNavItems = [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ];

  return (
    <>
      <Sidebar variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton size="lg" asChild>
                <a href="/">
                  <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Command className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">beacon.ai</span>
                    <span className="truncate text-xs">
                      AI-Powered Learning
                    </span>
                  </div>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <NavFolders />
        </SidebarContent>
        <SidebarFooter>{userInfo && <NavUser user={userInfo} />}</SidebarFooter>
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
