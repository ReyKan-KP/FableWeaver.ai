"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { updateProfile } from "@/actions/profile-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Upload, X } from "lucide-react";

interface ProfileFormProps {
  user: {
    id: string;
    name: string;
    email: string;
    image: string;
  };
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(user.image);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const router = useRouter();
  const { update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File Too Large", {
          description: "Please select an image under 5MB",
        });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        toast.error("Invalid File Type", {
          description: "Please select an image file",
        });
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setRemoveAvatar(false);
      
      toast("Image Selected", {
        description: "Your new avatar has been selected. Don't forget to save your changes!",
      });
    }
  }

  function handleRemoveAvatar() {
    setAvatarFile(null);
    setAvatarPreview("");
    setRemoveAvatar(true);
    
    toast("Avatar Removed", {
      description: "Your avatar will be removed when you save changes",
    });
  }

  async function handleSubmit(formData: FormData) {
    const username = formData.get("username") as string;
    
    // Validate username
    if (!username || username.trim().length < 3) {
      toast.error("Invalid Username", {
        description: "Username must be at least 3 characters long",
      });
      return;
    }

    setLoading(true);

    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    if (removeAvatar) {
      formData.append("removeAvatar", "true");
    }

    try {
      const result = await updateProfile(formData);
      if (result.error) throw new Error(result.error);

      // Update the session
      await updateSession({
        name: result.userName,
        image: result.avatarUrl,
      });

      toast("Profile Updated Successfully", {
        description: "Your profile changes have been saved",
      });

      // Show additional toast for specific changes
      if (result.userName !== user.name) {
        toast("Username Changed", {
          description: `Your username has been updated to ${result.userName}`,
        });
      }

      if (result.avatarUrl !== user.image) {
        toast("Avatar Updated", {
          description: removeAvatar ? "Your avatar has been removed" : "Your new avatar has been set",
        });
      }

      router.refresh();
    } catch (error) {
      toast.error("Update Failed", {
        description: error instanceof Error ? error.message : "Failed to update profile. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your profile information and manage your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback>{user.name?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              {(avatarPreview || user.image) && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 rounded-full"
                  onClick={handleRemoveAvatar}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
              >
                <Upload className="mr-2 h-4 w-4" />
                Change Avatar
              </Button>
              <Input
                ref={fileInputRef}
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              defaultValue={user.name}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="bg-muted"
            />
            <p className="text-sm text-muted-foreground">
              Email cannot be changed
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
