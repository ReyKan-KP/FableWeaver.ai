"use client";

import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";

export default function SystemSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    siteName: "Story Weaver",
    siteDescription: "AI-powered creative writing platform",
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerificationRequired: true,
    maxUploadSize: 5,
    backupFrequency: "daily",
    emailSettings: {
      smtpHost: "smtp.example.com",
      smtpPort: 587,
      smtpUser: "notifications@example.com",
      smtpPassword: "••••••••••",
    },
    storageSettings: {
      provider: "supabase",
      bucketName: "story-weaver-storage",
      region: "us-east-1",
    },
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // API call to save settings
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({
        title: "Settings saved",
        description: "System settings have been updated successfully.",
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
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-gray-500">
            Configure global system settings and preferences
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
              <Settings className="h-5 w-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input
                value={settings.siteName}
                onChange={(e) =>
                  setSettings({ ...settings, siteName: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Site Description</Label>
              <Textarea
                value={settings.siteDescription}
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
                checked={settings.maintenanceMode}
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
                checked={settings.registrationEnabled}
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
                checked={settings.emailVerificationRequired}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, emailVerificationRequired: checked })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Max Upload Size (MB)</Label>
              <Input
                type="number"
                value={settings.maxUploadSize}
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
                value={settings.emailSettings.smtpHost}
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
                value={settings.emailSettings.smtpPort}
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
                value={settings.emailSettings.smtpUser}
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
                value={settings.emailSettings.smtpPassword}
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
                value={settings.storageSettings.provider}
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
                value={settings.storageSettings.bucketName}
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
                value={settings.backupFrequency}
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