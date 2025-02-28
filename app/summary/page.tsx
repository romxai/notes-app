"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Sample data for summaries
const sampleSummaries = [
  {
    id: 1,
    title: "Chapter 1: Introduction to Biology",
    content:
      "This chapter introduces the fundamental concepts of biology, including the study of life, scientific method, and basic principles of cellular organization. Key topics covered include the characteristics of living organisms, the hierarchy of biological organization, and the importance of evolution as a unifying concept in biology.",
  },
  {
    id: 2,
    title: "Chapter 2: Cell Structure and Function",
    content:
      "This chapter explores the structure and function of cells, the basic units of life. It covers cell theory, cell types (prokaryotic and eukaryotic), cell organelles and their functions, and the cell membrane. The chapter also discusses how cells maintain homeostasis and the mechanisms of cellular transport, including diffusion, osmosis, and active transport.",
  },
  {
    id: 3,
    title: "Chapter 3: Cellular Metabolism",
    content:
      "This chapter delves into cellular metabolism, the set of chemical reactions that occur in living organisms to maintain life. It covers energy concepts, ATP as the energy currency of cells, enzymes and their role in metabolism, and the major metabolic pathways including glycolysis, the citric acid cycle, and oxidative phosphorylation. The chapter also discusses photosynthesis and how it relates to cellular respiration.",
  },
  {
    id: 4,
    title: "Chapter 4: Cell Division and Genetics",
    content:
      "This chapter focuses on cell division and genetics, explaining how cells reproduce and how genetic information is passed from one generation to the next. It covers the cell cycle, mitosis, meiosis, and the basics of Mendelian genetics. The chapter also introduces DNA structure, replication, and the central dogma of molecular biology (DNA to RNA to protein).",
  },
]

export default function SummaryPage() {
  const [expandedChapters, setExpandedChapters] = useState<number[]>([])

  const toggleChapter = (id: number) => {
    setExpandedChapters((prev) => (prev.includes(id) ? prev.filter((chapterId) => chapterId !== id) : [...prev, id]))
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-3xl font-bold">Chapter Summaries</h1>
      </div>

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

