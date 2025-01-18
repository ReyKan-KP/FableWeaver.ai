"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@supabase/auth-helpers-react";
import { Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";

interface RecommendationFormProps {
  onSubmit: (formData: any, isHistory: boolean) => Promise<void>;
  isLoading: boolean;
}

export function RecommendationForm({
  onSubmit,
  isLoading,
}: RecommendationFormProps) {
  const [query, setQuery] = useState("");
  const [nResults, setNResults] = useState(5);
  const [personalized, setPersonalized] = useState(false);
  const user = useUser();

  const handleSubmit = async (e: React.FormEvent, isHistory: boolean) => {
    e.preventDefault();
    if (isHistory && !user) {
      alert("Please login to use history-based recommendations");
      return;
    }
    const formData = {
      query,
      n_results: nResults,
      personalized,
      user_id: user?.id,
    };
    await onSubmit(formData, isHistory);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-2xl mx-auto mb-8"
    >
      <Tabs defaultValue="query" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="query">Query-based</TabsTrigger>
          <TabsTrigger value="history" disabled={!user}>
            History-based
          </TabsTrigger>
        </TabsList>
        <TabsContent value="query">
          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="query">Anime Preferences</Label>
              <Input
                id="query"
                placeholder="Enter your anime preferences (e.g., action anime between 2020-2021 with rating above 7.5)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="n-results">Number of Results</Label>
              <Slider
                id="n-results"
                min={1}
                max={20}
                step={1}
                value={[nResults]}
                onValueChange={(value) => setNResults(value[0])}
              />
              <div className="text-center">{nResults}</div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="personalized"
                checked={personalized}
                onCheckedChange={setPersonalized}
              />
              <Label htmlFor="personalized">Personalized Recommendations</Label>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting recommendations...
                </>
              ) : (
                "Get Recommendations"
              )}
            </Button>
          </form>
        </TabsContent>
        <TabsContent value="history">
          <form onSubmit={(e) => handleSubmit(e, true)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="history-query">
                Additional Preferences (Optional)
              </Label>
              <Input
                id="history-query"
                placeholder="Add specific preferences to your history-based recommendations"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="history-n-results">Number of Results</Label>
              <Slider
                id="history-n-results"
                min={1}
                max={20}
                step={1}
                value={[nResults]}
                onValueChange={(value) => setNResults(value[0])}
              />
              <div className="text-center">{nResults}</div>
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !user}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Getting recommendations...
                </>
              ) : (
                "Get History-based Recommendations"
              )}
            </Button>
          </form>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
