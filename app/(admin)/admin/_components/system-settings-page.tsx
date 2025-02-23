"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Save,
  Loader2,
  Mail,
  Shield,
  Database,
  Cloud,
} from "lucide-react";
import { toast } from "sonner";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("*")
          .single();

        if (error) throw error;

        setSettings(data);
        toast("Settings Loaded", {
          description: "System settings have been loaded successfully",
        });
      } catch (error) {
        console.error("Error fetching system settings:", error);
        toast.error("Error Loading Settings", {
          description: "Failed to load system settings. Please refresh the page.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async (formData: SystemSettings) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("system_settings")
        .update(formData)
        .eq("id", settings?.id);

      if (error) throw error;

      setSettings(formData);
      toast("Settings Saved", {
        description: "System settings have been updated successfully",
      });
    } catch (error) {
      console.error("Error saving system settings:", error);
      toast.error("Error Saving Settings", {
        description: "Failed to save system settings. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-gray-500">
            Configure global system settings and preferences
          </p>
        </div>
        <Button
          onClick={() => handleSave(settings as SystemSettings)}
          disabled={isLoading || isSaving}
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
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input
                value={settings?.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Site Description</Label>
              <Textarea
                value={settings?.siteDescription}
                onChange={(e) =>
                  setSettings({ ...settings, siteDescription: e.target.value })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Maintenance Mode</Label>
                <p className="text-sm text-gray-500">
                  Temporarily disable access to the platform
                </p>
              </div>
              <Switch
                checked={settings?.maintenanceMode}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, maintenanceMode: checked })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>User Registration</Label>
                <p className="text-sm text-gray-500">
                  Allow new user registrations
                </p>
              </div>
              <Switch
                checked={settings?.registrationEnabled}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, registrationEnabled: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Verification</Label>
                <p className="text-sm text-gray-500">
                  Require email verification for new accounts
                </p>
              </div>
              <Switch
                checked={settings?.emailVerificationRequired}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailVerificationRequired: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Max Upload Size (MB)</Label>
              <Input
                type="number"
                value={settings?.maxUploadSize}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxUploadSize: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>SMTP Host</Label>
              <Input
                value={settings?.emailSettings.smtpHost}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailSettings: {
                      ...settings.emailSettings,
                      smtpHost: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>SMTP Port</Label>
              <Input
                type="number"
                value={settings?.emailSettings.smtpPort}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailSettings: {
                      ...settings.emailSettings,
                      smtpPort: parseInt(e.target.value),
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>SMTP User</Label>
              <Input
                value={settings?.emailSettings.smtpUser}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailSettings: {
                      ...settings.emailSettings,
                      smtpUser: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>SMTP Password</Label>
              <Input
                type="password"
                value={settings?.emailSettings.smtpPassword}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailSettings: {
                      ...settings.emailSettings,
                      smtpPassword: e.target.value,
                    },
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Storage & Backup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Storage Provider</Label>
              <Select
                value={settings?.storageSettings.provider}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    storageSettings: {
                      ...settings.storageSettings,
                      provider: value,
                    },
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="supabase">Supabase Storage</SelectItem>
                  <SelectItem value="s3">Amazon S3</SelectItem>
                  <SelectItem value="cloudinary">Cloudinary</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Bucket Name</Label>
              <Input
                value={settings?.storageSettings.bucketName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    storageSettings: {
                      ...settings.storageSettings,
                      bucketName: e.target.value,
                    },
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Backup Frequency</Label>
              <Select
                value={settings?.backupFrequency}
                onValueChange={(value) =>
                  setSettings({ ...settings, backupFrequency: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 