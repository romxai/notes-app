"use client";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { FolderPlus } from "lucide-react";
import { FolderList } from "@/components/folder-list";
import { MagicCard } from "@/components/magicui/magic-card";

export default function HomePage() {
  return (
    <>
      <AppSidebar />
      <SidebarInset>
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 max-w-screen-2xl items-center">
            <div className="flex items-center gap-4 px-4">
              <SidebarTrigger className="-ml-1 bg-accent" />
              <Separator
                orientation="vertical"
                className="mr-2 data-[orientation=vertical]:h-4"
              />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="container max-w-screen-2xl space-y-8 p-6">
            <div className="flex items-center justify-between">
                <div className="p-4">
                  <h1 className="text-3xl font-bold text-primary">
                    Study Folders
                  </h1>
                </div>
            </div>

            {/* Folder List */}
            <div className="grid gap-6">
              <FolderList />
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
