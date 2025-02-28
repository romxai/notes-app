"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { FileText, RefreshCw, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";

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

export default function SummaryPage() {
  const { folderId } = useParams();
  const { toast } = useToast();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    fetchSummaries();
  }, [folderId]);

  const fetchSummaries = async () => {
    try {
      const response = await fetch(`/api/summaries?folderId=${folderId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch summaries");
      }

      const data: Summary[] = await response.json();
      if (data.length === 0) {
        throw new Error("No new files to summarize");
      }

      // Ensure correct structure
      const processedSummaries = data.map((summary) => ({
        ...summary,
        chapters: Array.isArray(summary.chapters) ? summary.chapters : [],
      }));

      setSummaries(processedSummaries);
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

      const data: Summary[] = await response.json();
      if (!response.ok) throw new Error(data.error);

      if (data.message === "No new files to summarize") {
        toast({
          title: "Info",
          description: "No new files to summarize",
        });
      } else {
        setSummaries((prev) => [...prev, ...data]);
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
          summaries.map((summary) => (
            <Card key={summary._id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  {summary.fileName}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Generated on{" "}
                  {new Date(summary.createdAt).toLocaleDateString()}
                </p>
              </CardHeader>
              <CardContent>
                {summary.chapters.length > 0 ? (
                  summary.chapters.map((chapter, index) => (
                    <Collapsible key={index}>
                      <CollapsibleTrigger className="w-full flex justify-between items-center text-lg font-semibold">
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5" />
                          {chapter.title}
                        </div>
                        <ChevronDown className="h-5 w-5 transition-transform" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <CardContent className="text-muted-foreground whitespace-pre-wrap">
                          {chapter.content}
                        </CardContent>
                      </CollapsibleContent>
                    </Collapsible>
                  ))
                ) : (
                  <p className="text-muted-foreground">
                    No chapters available.
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No summaries generated yet. Click the button above to generate
              summaries.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
