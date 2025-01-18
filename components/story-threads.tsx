"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
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
      className="w-full max-w-2xl mx-auto mb-8 p-4 rounded-lg shadow-md"
    >
      <Tabs defaultValue="query" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="query">Weave New Story</TabsTrigger>
          <TabsTrigger value="history" disabled={!session}>
            Intertwine History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="query">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="query" className="text-lg font-semibold">
                Craft Your Tale
              </Label>
              <Input
                id="query"
                placeholder="Describe your ideal anime story..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-purple-900/30 border-purple-600 placeholder-purple-300 dark:bg-purple-900/10 dark:border-purple-400 dark:placeholder-purple-200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-results" className="text-lg font-semibold">
                Story Threads
              </Label>
              <Slider
                id="n-results"
                min={1}
                max={20}
                step={1}
                value={[nResults]}
                onValueChange={(value) => setNResults(value[0])}
                className="bg-blue-900/30 dark:bg-blue-900/10"
              />
              <div className="text-center text-sm">{nResults} threads</div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="personalized"
                checked={personalized}
                onCheckedChange={setPersonalized}
              />
              <Label htmlFor="personalized" className="text-lg font-semibold">
                Personalized Tapestry
              </Label>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Weaving your story...
                </>
              ) : (
                "Weave Your Anime Tale"
              )}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="history">
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="history-query" className="text-lg font-semibold">
                Enhance Your Tapestry
              </Label>
              <Input
                id="history-query"
                placeholder="Add specific threads to your historical tapestry..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-teal-900/30 border-teal-600 placeholder-teal-300 dark:bg-teal-900/10 dark:border-teal-400 dark:placeholder-teal-200"
              />
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="history-n-results"
                className="text-lg font-semibold"
              >
                Story Threads
              </Label>
              <Slider
                id="history-n-results"
                min={1}
                max={20}
                step={1}
                value={[nResults]}
                onValueChange={(value) => setNResults(value[0])}
                className="bg-blue-900/30 dark:bg-blue-900/10"
              />
              <div className="text-center text-sm">{nResults} threads</div>
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-200"
              disabled={isLoading || !session}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Intertwining your history...
                </>
              ) : (
                "Intertwine Your Anime History"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
