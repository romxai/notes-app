import { Button } from "@/components/ui/button"
import { FolderPlus } from "lucide-react"
import { FolderList } from "@/components/folder-list"

export default function Home() {
  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Study Folders</h1>
        <Button>
          <FolderPlus className="mr-2 h-4 w-4" />
          New Folder
        </Button>
      </div>

      <FolderList />
    </div>
  )
}

