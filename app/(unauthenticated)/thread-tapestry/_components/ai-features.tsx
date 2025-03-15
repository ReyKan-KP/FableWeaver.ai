"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, MessageSquare, FileText } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface AIFeaturesProps {
    content: string;
    threadId?: string;
    onEnhancedContent?: (content: string) => void;
}

export default function AIFeatures({ content, threadId, onEnhancedContent }: AIFeaturesProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [showSummary, setShowSummary] = useState(false);
    const [showEnhancements, setShowEnhancements] = useState(false);
    const [suggestions, setSuggestions] = useState<any>(null);
    const [summary, setSummary] = useState<any>(null);
    const [enhancedResult, setEnhancedResult] = useState<any>(null);
    const { toast } = useToast();

    const handleAIAction = async (action: "enhance" | "suggest" | "summarize") => {
        setIsLoading(true);
        try {
            const response = await fetch("/api/thread-tapestry", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action,
                    content,
                    threadId,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to process request");
            }

            const data = await response.json();

            switch (action) {
                case "enhance":
                    setEnhancedResult(data);
                    setShowEnhancements(true);
                    if (onEnhancedContent) {
                        onEnhancedContent(data.enhancedContent);
                    }
                    break;
                case "suggest":
                    setSuggestions(data);
                    setShowSuggestions(true);
                    break;
                case "summarize":
                    setSummary(data);
                    setShowSummary(true);
                    break;
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to process your request. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIAction("enhance")}
                    disabled={isLoading}
                    className="flex items-center gap-2 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                >
                    <Sparkles className="w-4 h-4 text-violet-500" />
                    Enhance Content
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIAction("suggest")}
                    disabled={isLoading}
                    className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                    Get Suggestions
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAIAction("summarize")}
                    disabled={isLoading}
                    className="flex items-center gap-2 hover:bg-teal-50 dark:hover:bg-teal-900/20"
                >
                    <FileText className="w-4 h-4 text-teal-500" />
                    Summarize Thread
                </Button>
            </div>

            {/* Enhancements Dialog */}
            <Dialog open={showEnhancements} onOpenChange={setShowEnhancements}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                            Content Enhancements
                        </DialogTitle>
                        <DialogDescription>
                            AI-enhanced version of your content with improvements
                        </DialogDescription>
                    </DialogHeader>
                    {enhancedResult && (
                        <div className="space-y-6 py-4">
                            <Card className="p-4 space-y-3 bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
                                <h3 className="font-semibold text-violet-700 dark:text-violet-300">Improvements Made</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    {enhancedResult.improvements.map((improvement: string, i: number) => (
                                        <li key={i}>{improvement}</li>
                                    ))}
                                </ul>
                            </Card>

                            <Card className="p-4 space-y-3">
                                <h3 className="font-semibold">Enhanced Content</h3>
                                <div className="prose dark:prose-invert max-w-none">
                                    <p className="whitespace-pre-wrap">{enhancedResult.enhancedContent}</p>
                                </div>
                            </Card>
                        </div>
                    )}
                    <DialogFooter className="flex justify-between">
                        <Button variant="outline" onClick={() => setShowEnhancements(false)}>
                            Cancel
                        </Button>
                        {/* <Button 
                            onClick={() => {
                                if (onEnhancedContent && enhancedResult) {
                                    onEnhancedContent(enhancedResult.enhancedContent);
                                    setShowEnhancements(false);
                                    toast({
                                        title: "Content Updated",
                                        description: "Your content has been enhanced by AI.",
                                    });
                                }
                            }}
                            className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white"
                        >
                            Apply Changes
                        </Button> */}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Suggestions Dialog */}
            <Dialog open={showSuggestions} onOpenChange={setShowSuggestions}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                            AI-Generated Suggestions
                        </DialogTitle>
                        <DialogDescription>
                            Discussion points and questions to spark meaningful conversation
                        </DialogDescription>
                    </DialogHeader>
                    {suggestions && (
                        <div className="space-y-6 py-4">
                            <Card className="p-4 space-y-3 bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
                                <h3 className="font-semibold text-violet-700 dark:text-violet-300">Discussion Points</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    {suggestions.discussionPoints.map((point: string, i: number) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </Card>

                            <Card className="p-4 space-y-3 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Thought-Provoking Questions</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    {suggestions.questions.map((question: string, i: number) => (
                                        <li key={i}>{question}</li>
                                    ))}
                                </ul>
                            </Card>

                            <Card className="p-4 space-y-3 bg-teal-50/50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800">
                                <h3 className="font-semibold text-teal-700 dark:text-teal-300">Related Topics</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    {suggestions.relatedTopics.map((topic: string, i: number) => (
                                        <li key={i}>{topic}</li>
                                    ))}
                                </ul>
                            </Card>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowSuggestions(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Summary Dialog */}
            <Dialog open={showSummary} onOpenChange={setShowSummary}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                            Thread Summary
                        </DialogTitle>
                        <DialogDescription>
                            Key points and takeaways from the discussion
                        </DialogDescription>
                    </DialogHeader>
                    {summary && (
                        <div className="space-y-6 py-4">
                            <Card className="p-4 bg-gradient-to-r from-violet-50/50 via-blue-50/50 to-teal-50/50 dark:from-violet-900/20 dark:via-blue-900/20 dark:to-teal-900/20">
                                <p className="text-lg font-medium">{summary.briefSummary}</p>
                            </Card>

                            <Card className="p-4 space-y-3 bg-violet-50/50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800">
                                <h3 className="font-semibold text-violet-700 dark:text-violet-300">Key Points</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    {summary.keyPoints.map((point: string, i: number) => (
                                        <li key={i}>{point}</li>
                                    ))}
                                </ul>
                            </Card>

                            <Card className="p-4 space-y-3 bg-blue-50/50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                <h3 className="font-semibold text-blue-700 dark:text-blue-300">Main Takeaways</h3>
                                <ul className="list-disc list-inside space-y-2 text-sm">
                                    {summary.mainTakeaways.map((takeaway: string, i: number) => (
                                        <li key={i}>{takeaway}</li>
                                    ))}
                                </ul>
                            </Card>

                            <div className="flex items-center justify-between px-4 py-2 rounded-lg bg-teal-50/50 dark:bg-teal-900/20">
                                <span className="font-medium">Overall Sentiment:</span>
                                <span className="px-3 py-1 rounded-full text-sm font-medium bg-white dark:bg-black/20">
                                    {summary.sentiment}
                                </span>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button onClick={() => setShowSummary(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
} 