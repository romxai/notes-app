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
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <SidebarTrigger className="mr-2" />
          <h1 className="text-3xl font-bold">Document Summaries</h1>
        </div>
        <Button
          onClick={generateSummaries}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
          />
          {isGenerating ? "Generating..." : "Generate Summaries"}
        </Button>
      </div>

      <div className="grid gap-6">
        {summaries.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {summaries.map((summary) => (
              <AccordionItem
                key={summary._id}
                value={summary._id}
                className="border rounded-lg px-4"
              >
                <AccordionTrigger className="hover:no-underline py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <h3 className="text-lg font-semibold">
                        {summary.fileName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {summary.chapters.length} chapters • Generated{" "}
                        {new Date(summary.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="pt-2 pb-4">
                    <Accordion type="single" collapsible className="w-full">
                      {Array.isArray(summary.chapters) &&
                      summary.chapters.some((ch) => ch.title && ch.content) ? (
                        summary.chapters.map((chapter, index) => (
                          <AccordionItem
                            key={`${summary._id}-${index}`}
                            value={`chapter-${index}`}
                            className="border-b last:border-0"
                          >
                            <AccordionTrigger className="py-3 hover:no-underline">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                  {chapter.title}
                                </span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="py-3 px-4 text-sm text-muted-foreground bg-muted/50 rounded-md">
                                {chapter.content}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))
                      ) : (
                        <div className="py-3 px-4 text-sm text-muted-foreground">
                          No valid chapters found for this document.
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
            <p className="text-muted-foreground">
              No summaries generated yet. Click the button above to generate
              summaries for your documents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
