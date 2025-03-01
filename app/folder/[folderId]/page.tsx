"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { MagicCard } from "@/components/magicui/magic-card";

export default function FolderPage({
  params,
}: {
  params: { folderId: string };
}) {
  const [folderName, setFolderName] = useState("");

  // In a real application, you would fetch the folder data based on the folderId
  useEffect(() => {
    const fetchFolder = async () => {
      try {
        const response = await fetch(`/api/folders/${params.folderId}`);
        console.log(response);
        if (!response.ok) throw new Error("Failed to fetch folder");
        const folderData = await response.json();
        setFolderName(folderData.name); // Assuming the API returns an object with a 'name' property
      } catch (error) {
        console.error(error);
      }
    };

    fetchFolder();
  }, [params.folderId]);

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
            <Button asChild className="w-full">
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
            <Button asChild className="w-full">
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
            <Button asChild className="w-full">
              <Link href={`/folder/${params.folderId}/chat/1`}>Open Chat</Link>
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
            <Button asChild className="w-full">
              <Link href={`/folder/${params.folderId}/quiz/1`}>Start Quiz</Link>
            </Button>
          </div>
        </MagicCard>
      </div>
    </div>
  );
}
