"use client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react";

export default function FolderPage({ params }: { params: { folderId: string } }) {
  const [folderName, setFolderName] = useState("");

  // In a real application, you would fetch the folder data based on the folderId
  useEffect(() => {
    const fetchFolder = async () => {
      try {
        const response = await fetch(`/api/folders/${params.folderId}`);
        console.log(response)
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
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">{folderName}</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upload Notes</CardTitle>
            <CardDescription>Add new study materials</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Upload PDFs, text files, and other documents to this folder.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/folder/${params.folderId}/upload`}>Go to Upload</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>View Summaries</CardTitle>
            <CardDescription>Review your notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Access AI-generated summaries of your uploaded notes.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/folder/${params.folderId}/summary`}>View Summaries</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>Ask questions about your notes</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Start a new chat or continue an existing conversation.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/folder/${params.folderId}/chat/1`}>Open Chat</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Flash Cards</CardTitle>
            <CardDescription>Test your knowledge</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Create or review flash card sets based on your notes.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/folder/${params.folderId}/flash-cards/1`}>Start Learning</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quiz</CardTitle>
            <CardDescription>Challenge yourself</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Take quizzes generated from your study materials.</p>
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link href={`/folder/${params.folderId}/quiz/1`}>Start Quiz</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

