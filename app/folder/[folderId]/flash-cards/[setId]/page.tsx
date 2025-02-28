"use client"

import { useState } from "react"
import { Check, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Sample flash cards data
const sampleFlashCards = [
  {
    id: 1,
    question: "What is the primary function of mitochondria?",
    answer:
      "Mitochondria are known as the powerhouse of the cell. Their primary function is to generate energy in the form of ATP through cellular respiration.",
  },
  {
    id: 2,
    question: "What is the difference between prokaryotic and eukaryotic cells?",
    answer:
      "Prokaryotic cells lack a nucleus and membrane-bound organelles, while eukaryotic cells have a true nucleus and various membrane-bound organelles.",
  },
  {
    id: 3,
    question: "What is the central dogma of molecular biology?",
    answer:
      "The central dogma of molecular biology describes the flow of genetic information: DNA is transcribed into RNA, which is then translated into proteins.",
  },
  {
    id: 4,
    question: "What are the four primary tissue types in the human body?",
    answer:
      "The four primary tissue types are epithelial tissue, connective tissue, muscle tissue, and nervous tissue.",
  },
  {
    id: 5,
    question: "What is the function of enzymes in cellular metabolism?",
    answer:
      "Enzymes are biological catalysts that speed up chemical reactions in cells without being consumed in the process. They lower the activation energy required for reactions to occur.",
  },
]

export default function FlashCardsPage() {
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [learnedCards, setLearnedCards] = useState<number[]>([])
  const [flaggedCards, setFlaggedCards] = useState<number[]>([])

  const currentCard = sampleFlashCards[currentCardIndex]
  const totalCards = sampleFlashCards.length

  const nextCard = () => {
    if (currentCardIndex < totalCards - 1) {
      setCurrentCardIndex(currentCardIndex + 1)
      setIsFlipped(false)
    }
  }

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1)
      setIsFlipped(false)
    }
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  const markAsLearned = () => {
    if (!learnedCards.includes(currentCard.id)) {
      setLearnedCards([...learnedCards, currentCard.id])
    }
    nextCard()
  }

  const toggleFlagged = () => {
    if (flaggedCards.includes(currentCard.id)) {
      setFlaggedCards(flaggedCards.filter((id) => id !== currentCard.id))
    } else {
      setFlaggedCards([...flaggedCards, currentCard.id])
    }
  }

  const resetCards = () => {
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setLearnedCards([])
    setFlaggedCards([])
  }

  const isLearned = learnedCards.includes(currentCard.id)
  const isFlagged = flaggedCards.includes(currentCard.id)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-3xl font-bold">Flash Cards</h1>
      </div>

      <div className="flex flex-col items-center">
        <div className="w-full max-w-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Card {currentCardIndex + 1} of {totalCards}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={resetCards}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
            </div>
          </div>

          <Card
            className={`w-full h-64 cursor-pointer perspective-1000 transition-transform duration-500 ${
              isFlipped ? "rotate-y-180" : ""
            }`}
            onClick={flipCard}
          >
            <div className="relative w-full h-full transform-style-3d">
              <CardContent
                className={`absolute w-full h-full p-6 flex items-center justify-center backface-hidden ${
                  isFlipped ? "rotate-y-180 hidden" : ""
                }`}
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Question:</h3>
                  <p>{currentCard.question}</p>
                  {isFlagged && (
                    <div className="absolute top-2 right-2">
                      <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800">
                        Flagged for review
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardContent
                className={`absolute w-full h-full p-6 flex items-center justify-center backface-hidden ${
                  isFlipped ? "" : "rotate-y-180 hidden"
                }`}
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2">Answer:</h3>
                  <p>{currentCard.answer}</p>
                </div>
              </CardContent>
            </div>
          </Card>

          <div className="flex justify-between items-center mt-6">
            <Button variant="outline" onClick={prevCard} disabled={currentCardIndex === 0}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant={isFlagged ? "default" : "outline"}
                className={isFlagged ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                onClick={toggleFlagged}
              >
                {isFlagged ? "Unflag" : "Flag for Review"}
              </Button>

              <Button
                variant="outline"
                className={isLearned ? "bg-green-500 text-white hover:bg-green-600" : ""}
                onClick={markAsLearned}
              >
                <Check className="h-4 w-4 mr-1" />
                {isLearned ? "Learned" : "Mark as Learned"}
              </Button>
            </div>

            <Button variant="outline" onClick={nextCard} disabled={currentCardIndex === totalCards - 1}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

