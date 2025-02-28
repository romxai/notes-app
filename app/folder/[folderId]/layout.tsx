import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"

export default function FolderLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { folderId: string }
}) {
  return (
    <div className="flex min-h-screen">
      <AppSidebar folderId={params.folderId} />
      <main className="flex-1">{children}</main>
    </div>
  )
}

