"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, RefreshCw, ChevronDown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Chapter {
  title: string;
  content: string;
}

interface Summary {
  _id: string;
  fileName: string;
  chapters: Chapter[];
  createdAt: string;
}

interface ApiResponse {
  error?: string;
  message?: string;
  data?: Summary[];
}

export default function SummaryPage() {
  const { folderId } = useParams();
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedSummaries, setExpandedSummaries] = useState<string[]>([]);

  useEffect(() => {
    fetchSummaries();
  }, [folderId]);

  const fetchSummaries = async () => {
    try {
      const response = await fetch(`/api/summaries?folderId=${folderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch summaries");
      }

      setSummaries(data);
    } catch (error) {
      console.error("Error fetching summaries:", error);
      toast({
        title: "Error",
        description: "Failed to fetch summaries",
        variant: "destructive",
      });
    }
  };

  const generateSummaries = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate summaries");
      }

      if (data.message === "No new files to summarize") {
        toast({
          title: "Info",
          description: "No new files to summarize",
        });
      } else if (data.data) {
        setSummaries((prev) => [...prev, ...(data.data || [])]);
        toast({
          title: "Success",
          description: "Summaries generated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate summaries",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center">
          <h1 className="text-4xl font-bold text-primary">
            Document Summaries
          </h1>
        </div>
        <Button
          onClick={generateSummaries}
          disabled={isGenerating}
          className="bg-accent hover:bg-accent/90 text-accent-foreground w-full sm:w-auto"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`}
          />
          {isGenerating ? "Generating..." : "Generate Summaries"}
        </Button>
      </div>

      <div className="grid gap-6">
        {summaries.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-6">
            {summaries.map((summary) => (
              <AccordionItem
                key={summary._id}
                value={summary._id}
                className="border bg-card text-card-foreground rounded-xl px-6 shadow-sm"
              >
                <AccordionTrigger className="hover:no-underline py-6">
                  <div className="flex items-center gap-4 w-full">
                    <div className="bg-accent/10 p-2.5 rounded-lg">
                      <FileText className="h-5 w-5 text-accent" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="text-lg font-semibold text-primary">
                        {summary.fileName}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {summary.chapters.length} chapters • Generated{" "}
                        {new Date(summary.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-6">
                  <div className="space-y-4">
                    <Accordion type="single" collapsible className="w-full">
                      {Array.isArray(summary.chapters) &&
                      summary.chapters.some((ch) => ch.title && ch.content) ? (
                        summary.chapters.map((chapter, index) => (
                          <AccordionItem
                            key={index}
                            value={`${summary._id}-${index}`}
                            className="border-none bg-background/50 rounded-lg px-4 mt-2"
                          >
                            <AccordionTrigger className="py-4 hover:no-underline">
                              <div className="flex items-center gap-3">
                                <span className="text-primary font-medium">
                                  {chapter.title}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-4 text-primary/90">
                              <div className="prose prose-sm dark:prose-invert max-w-none">
                                {chapter.content}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="text-muted-foreground py-4">
                          No chapters available
                        </div>
                      )}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : (
          <div className="text-center py-12">
            <div className="bg-accent/10 p-4 rounded-full w-fit mx-auto mb-4">
              <FileText className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-primary mb-2">
              No summaries yet
            </h3>
            <p className="text-muted-foreground">
              Generate summaries to see them here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
