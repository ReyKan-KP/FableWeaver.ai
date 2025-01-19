"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Wand2 } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";

interface StoryThreadsProps {
  onSubmit: (formData: any, isHistory: boolean) => Promise<void>;
  isLoading: boolean;
}

export function StoryThreads({ onSubmit, isLoading }: StoryThreadsProps) {
  const [query, setQuery] = useState("");
  const [nResults, setNResults] = useState(5);
  const [personalized, setPersonalized] = useState(false);
  const { data: session } = useSession();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent, isHistory: boolean) => {
    e.preventDefault();
    if (isHistory && !session) {
      toast({
        title: "Authentication required",
        description: "Please login to use history-based recommendations",
        variant: "destructive",
      });
      return;
    }
    const formData = {
      query,
      n_results: nResults,
      personalized,
      user_id: session?.user?.id,
    };
    await onSubmit(formData, isHistory);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto mb-8 p-6 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-lg shadow-xl"
    >
      <Tabs defaultValue="query" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-purple-200 dark:bg-purple-800">
          <TabsTrigger
            value="query"
            className="data-[state=active]:bg-purple-400 dark:data-[state=active]:bg-purple-600"
          >
            Weave New Story
          </TabsTrigger>
          <TabsTrigger
            value="history"
            disabled={!session}
            className="data-[state=active]:bg-purple-400 dark:data-[state=active]:bg-purple-600"
          >
            Intertwine History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="query">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="query"
                className="text-lg font-semibold text-purple-800 dark:text-purple-200"
              >
                Craft Your Tale
              </Label>
              <Input
                id="query"
                placeholder="Describe your ideal anime story..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-purple-100 dark:bg-purple-900 border-purple-300 dark:border-purple-700 placeholder-purple-400 dark:placeholder-purple-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="n-results"
                className="text-lg font-semibold text-purple-800 dark:text-purple-200"
              >
                Story Threads
              </Label>
              <Slider
                id="n-results"
                min={1}
                max={10}
                step={1}
                value={[nResults]}
                onValueChange={(value) => setNResults(value[0])}
                className="bg-purple-200 dark:bg-purple-800"
              />
              <div className="text-center text-sm text-purple-600 dark:text-purple-300">
                {nResults} threads
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="personalized"
                checked={personalized}
                onCheckedChange={setPersonalized}
              />
              <Label
                htmlFor="personalized"
                className="text-lg font-semibold text-purple-800 dark:text-purple-200"
              >
                Personalized Tapestry
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Weaving your story...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Weave Your Anime Tale
                </>
              )}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="history">
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="history-query"
                className="text-lg font-semibold text-teal-800 dark:text-teal-200"
              >
                Enhance Your Tapestry
              </Label>
              <Input
                id="history-query"
                placeholder="Add specific threads to your historical tapestry..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-teal-100 dark:bg-teal-900 border-teal-300 dark:border-teal-700 placeholder-teal-400 dark:placeholder-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="history-n-results"
                className="text-lg font-semibold text-teal-800 dark:text-teal-200"
              >
                Story Threads
              </Label>
              <Slider
                id="history-n-results"
                min={1}
                max={10}
                step={1}
                value={[nResults]}
                onValueChange={(value) => setNResults(value[0])}
                className="bg-teal-200 dark:bg-teal-800"
              />
              <div className="text-center text-sm text-teal-600 dark:text-teal-300">
                {nResults} threads
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 text-white font-semibold py-2 px-4 rounded-md transition-all duration-300 transform hover:scale-105"
              disabled={isLoading || !session}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Intertwining your history...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Intertwine Your Anime History
                </>
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
