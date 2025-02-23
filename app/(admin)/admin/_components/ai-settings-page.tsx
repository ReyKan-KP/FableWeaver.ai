"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { AISettings } from "@/app/types/ai";

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("ai_settings")
          .select("*")
          .single();

        if (error) throw error;

        setSettings(data);
        toast("Settings Loaded", {
          description: "AI settings have been loaded successfully",
        });
      } catch (error) {
        console.error("Error fetching AI settings:", error);
        toast.error("Error Loading Settings", {
          description: "Failed to load AI settings. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (formData: AISettings) => {
    if (!formData?.id) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("ai_settings")
        .update(formData)
        .eq("id", formData.id);

      if (error) throw error;

      setSettings(formData);
      toast("Settings Saved", {
        description: "AI settings have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving AI settings:", error);
      toast.error("Error Saving Settings", {
        description: "Failed to save AI settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSettings = (update: Partial<AISettings>) => {
    if (!settings?.id) return;
    setSettings({ ...settings, ...update });
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">AI Settings</h1>
          <p className="text-sm text-gray-500">
            Configure AI behavior and parameters
          </p>
        </div>
        <Button
          onClick={() => settings && handleSave(settings)}
          disabled={isLoading || isSaving || !settings}
          className="bg-gradient-to-r from-violet-500 to-blue-500"
        >
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Model Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={settings?.model}
                onValueChange={(value) => updateSettings({ model: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-2">Claude 2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Temperature ({settings?.temperature || 0})</Label>
              <Slider
                value={[settings?.temperature || 0]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) => updateSettings({ temperature: value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={settings?.maxTokens || 0}
                onChange={(e) =>
                  updateSettings({ maxTokens: parseInt(e.target.value) })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Presence Penalty ({settings?.presencePenalty || 0})</Label>
              <Slider
                value={[settings?.presencePenalty || 0]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([value]) =>
                  updateSettings({ presencePenalty: value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency Penalty ({settings?.frequencyPenalty || 0})</Label>
              <Slider
                value={[settings?.frequencyPenalty || 0]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([value]) =>
                  updateSettings({ frequencyPenalty: value })
                }
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Safety & Consistency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto Moderation</Label>
                  <p className="text-sm text-gray-500">
                    Automatically moderate AI-generated content
                  </p>
                </div>
                <Switch
                  checked={settings?.autoModeration || false}
                  onCheckedChange={(checked) =>
                    updateSettings({ autoModeration: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Content Filtering</Label>
                  <p className="text-sm text-gray-500">
                    Filter inappropriate content
                  </p>
                </div>
                <Switch
                  checked={settings?.contentFiltering || false}
                  onCheckedChange={(checked) =>
                    updateSettings({ contentFiltering: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Character Consistency</Label>
                  <p className="text-sm text-gray-500">
                    Maintain consistent character behavior
                  </p>
                </div>
                <Switch
                  checked={settings?.characterConsistency || false}
                  onCheckedChange={(checked) =>
                    updateSettings({ characterConsistency: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>API Key</Label>
                <Input
                  type="password"
                  value={settings?.apiKey || ""}
                  onChange={(e) =>
                    updateSettings({ apiKey: e.target.value })
                  }
                />
                <p className="text-sm text-gray-500">
                  Your API key is encrypted and stored securely
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 