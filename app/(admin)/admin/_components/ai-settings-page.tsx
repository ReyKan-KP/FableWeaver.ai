"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

export default function AISettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    presencePenalty: 0.5,
    frequencyPenalty: 0.5,
    autoModeration: true,
    contentFiltering: true,
    characterConsistency: true,
    apiKey: "sk-••••••••••••••••••••••",
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulated API call
      toast({
        title: "Settings saved",
        description: "AI settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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
          onClick={handleSave}
          disabled={isLoading}
          className="bg-gradient-to-r from-violet-500 to-blue-500"
        >
          {isLoading ? (
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
                value={settings.model}
                onValueChange={(value) =>
                  setSettings({ ...settings, model: value })
                }
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
              <Label>Temperature ({settings.temperature})</Label>
              <Slider
                value={[settings.temperature]}
                min={0}
                max={1}
                step={0.1}
                onValueChange={([value]) =>
                  setSettings({ ...settings, temperature: value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={settings.maxTokens}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxTokens: parseInt(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Presence Penalty ({settings.presencePenalty})</Label>
              <Slider
                value={[settings.presencePenalty]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([value]) =>
                  setSettings({ ...settings, presencePenalty: value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Frequency Penalty ({settings.frequencyPenalty})</Label>
              <Slider
                value={[settings.frequencyPenalty]}
                min={0}
                max={2}
                step={0.1}
                onValueChange={([value]) =>
                  setSettings({ ...settings, frequencyPenalty: value })
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
                  checked={settings.autoModeration}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, autoModeration: checked })
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
                  checked={settings.contentFiltering}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, contentFiltering: checked })
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
                  checked={settings.characterConsistency}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, characterConsistency: checked })
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
                  value={settings.apiKey}
                  onChange={(e) =>
                    setSettings({ ...settings, apiKey: e.target.value })
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