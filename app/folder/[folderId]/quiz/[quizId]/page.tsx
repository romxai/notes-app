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
    <div className="container mx-auto p-6 space-y-6">
      {/* Sticky Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-border shadow-md -mx-6 px-6 py-4">
        <div className="flex items-center gap-4">
          <SidebarTrigger />
          <div>
            <h1 className="text-2xl font-semibold text-primary">
              {quiz.title}
            </h1>
            <p className="text-sm text-muted-foreground">Test your knowledge</p>
          </div>
        </div>
      </div>

      {!showResults ? (
        <div className="max-w-2xl mx-auto">
          <div className="mb-4 flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            <span className="text-sm font-medium text-primary">
              {Object.keys(selectedAnswers).length} answered
            </span>
          </div>

          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary">
                {currentQuestion.question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup
                value={selectedAnswers[currentQuestion.id]}
                onValueChange={handleAnswerSelect}
                className="space-y-4"
              >
                {currentQuestion.options.map((option) => (
                  <div
                    key={option.id}
                    className="flex items-center space-x-3 relative"
                  >
                    <RadioGroupItem
                      value={option.id}
                      id={`option-${option.id}`}
                      className="border-accent text-accent"
                    />
                    <Label
                      htmlFor={`option-${option.id}`}
                      className="text-card-foreground cursor-pointer flex-1 p-3 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      {option.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="flex justify-between border-t border-border pt-6">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentQuestionIndex === 0}
                className="text-primary"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous Question
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={!isAnswered}
                className="bg-accent hover:bg-accent/90 text-accent-foreground"
              >
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
          <Card className="border-border shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary">Quiz Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="text-center">
                <div className="text-5xl font-bold mb-2 text-primary">
                  {score}/{totalQuestions}
                </div>
                <div className="text-xl text-muted-foreground">
                  {percentage}% Correct
                </div>
              </div>

              <div className="space-y-4">
                {quiz.questions.map((question, index) => {
                  const userAnswer = selectedAnswers[question.id];
                  const isCorrect = userAnswer === question.correctAnswer;

                  return (
                    <div
                      key={question.id}
                      className={`border rounded-xl p-4 ${
                        isCorrect ? "border-green-500" : "border-red-500"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-full p-1.5 shrink-0 ${
                            isCorrect ? "bg-green-500/10" : "bg-red-500/10"
                          }`}
                        >
                          {isCorrect ? (
                            <Check className={`h-4 w-4 text-green-500`} />
                          ) : (
                            <X className={`h-4 w-4 text-red-500`} />
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <p className="font-medium text-primary">
                            {index + 1}. {question.question}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Your answer:{" "}
                            <span
                              className={
                                isCorrect ? "text-green-500" : "text-red-500"
                              }
                            >
                              {question.options.find((o) => o.id === userAnswer)
                                ?.text || "Not answered"}
                            </span>
                          </p>
                          {!isCorrect && (
                            <p className="text-sm">
                              Correct answer:{" "}
                              <span className="text-green-500">
                                {
                                  question.options.find(
                                    (o) => o.id === question.correctAnswer
                                  )?.text
                                }
                              </span>
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
              <Button
                onClick={resetQuiz}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                Retake Quiz
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
