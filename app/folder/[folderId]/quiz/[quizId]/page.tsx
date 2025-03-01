"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Check, X, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: number;
  question: string;
  options: Option[];
  correctAnswer: string;
}

interface Quiz {
  title: string;
  questions: Question[];
}

function QuizSkeleton() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-4 flex justify-between items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="border rounded-lg p-6 space-y-6">
        <Skeleton className="h-6 w-3/4" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { quizId } = useParams();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<
    Record<number, string>
  >({});
  const [showResults, setShowResults] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchQuiz();
  }, [quizId]);

  const fetchQuiz = async () => {
    console.log("Fetching quiz for instance:", quizId);
    try {
      const response = await fetch(`/api/quizzes?instanceId=${quizId}`);
      const data = await response.json();

      if (!response.ok) {
        console.error("Failed to fetch quiz:", data.error);
        throw new Error(data.error || "Failed to fetch quiz");
      }

      console.log("Quiz data received:", data);
      setQuiz(data);
    } catch (error) {
      console.error("Error in fetchQuiz:", error);
      toast({
        title: "Error",
        description: "Failed to fetch quiz",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center mb-6">
          <SidebarTrigger className="mr-2" />
          <h1 className="text-3xl font-bold">Quiz</h1>
        </div>
        <QuizSkeleton />
      </div>
    );
  }

  if (!quiz) {
    return <div>No quiz found</div>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const totalQuestions = quiz.questions.length;

  const handleAnswerSelect = (value: string) => {
    console.log("Selected answer:", {
      questionId: currentQuestion.id,
      selectedValue: value,
    });
    setSelectedAnswers({
      ...selectedAnswers,
      [currentQuestion.id]: value,
    });
  };

  const nextQuestion = () => {
    console.log("Moving to next question", {
      current: currentQuestionIndex,
      total: totalQuestions,
    });
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      console.log("Quiz completed, showing results");
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correctCount = 0;
    quiz.questions.forEach((question) => {
      if (selectedAnswers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    });
    return correctCount;
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setShowResults(false);
  };

  const isAnswered =
    currentQuestion && selectedAnswers[currentQuestion.id] !== undefined;
  const score = calculateScore();
  const percentage = Math.round((score / totalQuestions) * 100);

  const handleBack = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

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
            <span className="text-sm font-medium">
              {Object.keys(selectedAnswers).length} answered
            </span>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center">
                {currentQuestionIndex > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="mr-4"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <CardTitle>{currentQuestion.question}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedAnswers[currentQuestion.id]}
                onValueChange={handleAnswerSelect}
              >
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-2 mb-3"
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={`option-${option.id}`}
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="cursor-pointer"
                    >
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div></div>
              <Button onClick={nextQuestion} disabled={!isAnswered}>
                {currentQuestionIndex === totalQuestions - 1
                  ? "Finish Quiz"
                  : "Next Question"}
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
                {quiz.questions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <div
                          className={`rounded-full p-1 ${
                            isCorrect ? "bg-green-100" : "bg-red-100"
                          }`}
                        >
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
                            Your answer:{" "}
                            {question.options.find((o) => o.id === userAnswer)
                              ?.text || "Not answered"}
                          </p>
                          {!isCorrect && (
                            <p className="text-sm text-green-600 mt-1">
                              Correct answer:{" "}
                              {
                                question.options.find(
                                  (o) => o.id === question.correctAnswer
                                )?.text
                              }
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
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
  );
}
