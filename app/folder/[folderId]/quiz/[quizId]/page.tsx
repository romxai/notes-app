"use client"

import { useState } from "react"
import { Check, X, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Sample quiz data
const sampleQuiz = {
  title: "Biology Fundamentals Quiz",
  questions: [
    {
      id: 1,
      question: "Which organelle is responsible for protein synthesis in the cell?",
      options: [
        { id: "a", text: "Mitochondria" },
        { id: "b", text: "Ribosome" },
        { id: "c", text: "Golgi apparatus" },
        { id: "d", text: "Lysosome" },
      ],
      correctAnswer: "b",
    },
    {
      id: 2,
      question: "What is the process by which plants convert light energy into chemical energy?",
      options: [
        { id: "a", text: "Respiration" },
        { id: "b", text: "Fermentation" },
        { id: "c", text: "Photosynthesis" },
        { id: "d", text: "Transpiration" },
      ],
      correctAnswer: "c",
    },
    {
      id: 3,
      question: "Which of the following is NOT a function of the liver?",
      options: [
        { id: "a", text: "Detoxification of harmful substances" },
        { id: "b", text: "Production of bile" },
        { id: "c", text: "Storage of oxygen" },
        { id: "d", text: "Regulation of blood glucose" },
      ],
      correctAnswer: "c",
    },
    {
      id: 4,
      question: "What is the basic unit of heredity?",
      options: [
        { id: "a", text: "Cell" },
        { id: "b", text: "Chromosome" },
        { id: "c", text: "Gene" },
        { id: "d", text: "Nucleus" },
      ],
      correctAnswer: "c",
    },
    {
      id: 5,
      question: "Which of the following is a correct statement about DNA replication?",
      options: [
        { id: "a", text: "It is a conservative process" },
        { id: "b", text: "It occurs during the G1 phase of the cell cycle" },
        { id: "c", text: "It results in two identical DNA molecules" },
        { id: "d", text: "It requires RNA polymerase" },
      ],
      correctAnswer: "c",
    },
  ],
}

export default function QuizPage() {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({})
  const [showResults, setShowResults] = useState(false)

  const currentQuestion = sampleQuiz.questions[currentQuestionIndex]
  const totalQuestions = sampleQuiz.questions.length

  const handleAnswerSelect = (value: string) => {
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: value,
    })
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowResults(true)
    }
  }

  const calculateScore = () => {
    let correctCount = 0
    sampleQuiz.questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++
      }
    })
    return correctCount
  }

  const resetQuiz = () => {
    setCurrentQuestionIndex(0)
    setSelectedAnswers({})
    setShowResults(false)
  }

  const isAnswered = currentQuestion && selectedAnswers[currentQuestion.id] !== undefined
  const score = calculateScore()
  const percentage = Math.round((score / totalQuestions) * 100)

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center mb-6">
        <SidebarTrigger className="mr-2" />
        <h1 className="text-3xl font-bold">Quiz</h1>
      </div>

      {!showResults ? (
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm font-medium">{Object.keys(selectedAnswers).length} answered</span>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={selectedAnswers[currentQuestion.id]} onValueChange={handleAnswerSelect}>
                {currentQuestion.options.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2 mb-3">
                    <RadioGroupItem value={option.id} id={`option-${option.id}`} />
                    <Label htmlFor={`option-${option.id}`} className="cursor-pointer">
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div></div>
              <Button onClick={nextQuestion} disabled={!isAnswered}>
                {currentQuestionIndex === totalQuestions - 1 ? "Finish Quiz" : "Next Question"}
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <div className="text-5xl font-bold mb-2">
                  {score}/{totalQuestions}
                </div>
                <div className="text-xl">{percentage}% Correct</div>
              </div>

              <div className="space-y-4">
                {sampleQuiz.questions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id]
                  const isCorrect = userAnswer === question.correctAnswer

                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <div className={`rounded-full p-1 ${isCorrect ? "bg-green-100" : "bg-red-100"}`}>
                          {isCorrect ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <X className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">
                            {index + 1}. {question.question}
                          </p>
                          <p className="text-sm mt-1">
                            Your answer: {question.options.find((o) => o.id === userAnswer)?.text || "Not answered"}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct answer: {question.options.find((o) => o.id === question.correctAnswer)?.text}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={resetQuiz} className="w-full">
                Retake Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  )
}

