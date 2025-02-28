"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const sampleSummaries = [
  {
    id: 1,
    title: "Chapter 1: Introduction",
    content: "This chapter introduces the main concepts and themes of the book.",
  },
  {
    id: 2,
    title: "Chapter 2: The Problem",
    content: "This chapter delves into the core problem that the book aims to address.",
  },
  {
    id: 3,
    title: "Chapter 3: Proposed Solution",
    content: "This chapter outlines the proposed solution to the problem discussed in the previous chapter.",
  },
]

export default function SummaryPage({ params }: { params: { folderId: string } }) {
  const [expandedChapters, setExpandedChapters] = useState<number[]>([])

  const toggleChapter = (id: number) => {
    setExpandedChapters((prev) => (prev.includes(id) ? prev.filter((chapterId) => chapterId !== id) : [...prev, id]))
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Chapter Summaries</h1>

      <div className="space-y-4">
        {sampleSummaries.map((chapter) => (
          <Card key={chapter.id} className="overflow-hidden">
            <CardHeader className="p-4 cursor-pointer" onClick={() => toggleChapter(chapter.id)}>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{chapter.title}</CardTitle>
                <Button variant="ghost" size="icon">
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${
                      expandedChapters.includes(chapter.id) ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </div>
            </CardHeader>
            {expandedChapters.includes(chapter.id) && (
              <CardContent className="p-4 pt-0 border-t">
                <p className="text-muted-foreground">{chapter.content}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  )
}

