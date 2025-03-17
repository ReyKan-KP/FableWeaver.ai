"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Search, UserPlus, UserMinus, Users, AlertCircle, Trash, Edit, Check, X } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { UserAvatar } from "@/components/user-avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

type Friend = {
  user_id: string;
  user_name: string;
  avatar_url: string;
  is_active: boolean;
  last_seen: string;
  friendship_id: string;
  created_at: string;
};

type FriendshipData = {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  status: string;
};

type Collaborator = {
  id: string;
  novel_id: string;
  user_id: string;
  collaborator_id: string;
  role: "editor" | "viewer";
  created_at: string;
  user?: {
    user_name: string;
    user_email: string;
    avatar_url: string;
  };
};

interface CollaboratorsProps {
  novelId: string;
}


export default function Collaborators({ novelId }: CollaboratorsProps) {
  const { data: session } = useSession();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState<string | null>(null);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string>("");
  const [selectedRole, setSelectedRole] = useState<"editor" | "viewer">("viewer");
  const [isEditRoleDialogOpen, setIsEditRoleDialogOpen] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [newRole, setNewRole] = useState<"editor" | "viewer">("viewer");
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    if (!session?.user?.id || !novelId) return;
    
    fetchCollaboratorsAndFriends();
  }, [session, novelId]);

  const fetchCollaboratorsAndFriends = async () => {
    setIsLoading(true);
    
    try {
      // Fetch all users
      const { data: allUsers, error: usersError } = await supabase
        .from("user")
        .select(`
          user_id,
          user_name,
          user_email,
          avatar_url,
          is_active,
          last_seen
        `);
      
      if (usersError) throw usersError;

      // Fetch novel collaborators
      const { data: novelCollaborators, error: novelCollaboratorsError } = await supabase
        .from("novel_collaborators")
        .select(`*`)
        .eq("novel_id", novelId);

      if (novelCollaboratorsError) throw novelCollaboratorsError;
      
      // Process collaborators
      const processedCollaborators = [];
      
      for (const collaborator of novelCollaborators) {
        // Find the user data for this collaborator
        const userData = allUsers?.find(user => user.user_id === collaborator.collaborator_id);
        
        if (userData) {
          processedCollaborators.push({
            id: collaborator.id,
            novel_id: collaborator.novel_id,
            user_id: collaborator.user_id, // Owner of the novel
            collaborator_id: collaborator.collaborator_id,
            role: collaborator.role,
            created_at: collaborator.created_at,
            user: {
              user_name: userData.user_name,
              user_email: userData.user_email,
              avatar_url: userData.avatar_url
            }
          } as Collaborator);
        }
      }
      
      setCollaborators(processedCollaborators);
      
      // Fetch accepted friendships for the current user
      const { data: friendships, error: friendshipsError } = await supabase
        .from("friendships")
        .select(`
          id,
          user_id,
          friend_id,
          status,
          created_at
        `)
        .or(`user_id.eq.${session?.user.id},friend_id.eq.${session?.user.id}`)
        .eq("status", "accepted");
      
      if (friendshipsError) throw friendshipsError;
      
      // Filter users who are friends with the current user
      const friendUserIds = (friendships as FriendshipData[] || []).map(friendship => 
        friendship.user_id === session?.user.id ? friendship.friend_id : friendship.user_id
      );
      
      const friendUsers = allUsers?.filter(user => 
        friendUserIds.includes(user.user_id) && user.user_id !== session?.user.id
      ) || [];
      
      // Map to the Friend type
      const processedFriends = friendUsers.map(user => {
        // Find the corresponding friendship
        const friendship = (friendships as FriendshipData[] || []).find(f => 
          f.user_id === user.user_id || f.friend_id === user.user_id
        );
        
        return {
          user_id: user.user_id || "",
          user_name: user.user_name || "",
          avatar_url: user.avatar_url || "",
          is_active: user.is_active || false,
          last_seen: user.last_seen || "",
          friendship_id: friendship?.id || "",
          created_at: friendship?.created_at || ""
        };
      });
      
      setFriends(processedFriends);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load collaborators and friends");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteCollaborator = async () => {
    if (!selectedFriendId) {
      toast.error("Please select a friend to invite");
      return;
    }

    try {
      // First, get the user ID for the selected friend
      const selectedFriend = friends.find(friend => friend.user_id === selectedFriendId);
      
      if (!selectedFriend) {
        toast.error("Selected friend not found");
        return;
      }

      // Check if already a collaborator
      const isAlreadyCollaborator = collaborators.some(
        collab => collab.collaborator_id === selectedFriendId
      );

      if (isAlreadyCollaborator) {
        toast.error("This user is already a collaborator");
        return;
      }

      // Create new collaborator record
      // Use collaborator's ID as user_id to avoid unique constraint violation
      const { data, error } = await supabase
        .from("novel_collaborators")
        .insert([
          {
            novel_id: novelId,
            user_id: selectedFriendId, // Using collaborator's ID here instead of owner's ID
            collaborator_id: selectedFriendId,
            role: selectedRole,
          },
        ])
        .select()
        .single();
        
      if (error) throw error;

      // Fetch the user data for the new collaborator
      const { data: userData, error: userError } = await supabase
        .from("user")
        .select("user_id, user_name, user_email, avatar_url")
        .eq("user_id", selectedFriendId)
        .single();
        
      if (userError) throw userError;
      
      // Create a new collaborator object
      const newCollaborator: Collaborator = {
        id: data.id,
        novel_id: data.novel_id,
        user_id: data.user_id,
        collaborator_id: data.collaborator_id,
        role: data.role,
        created_at: data.created_at,
        user: {
          user_name: userData.user_name,
          user_email: userData.user_email,
          avatar_url: userData.avatar_url
        }
      };

      // Fetch novel details for the notification
      const { data: novelData, error: novelError } = await supabase
        .from("novels")
        .select("title")
        .eq("id", novelId)
        .single();
        
      if (novelError) throw novelError;

      // Send notification to the collaborator
      await supabase
        .from("notifications")
        .insert([
          {
            user_id: selectedFriendId,
            type: "collaboration_invite",
            title: "New Collaboration Invite",
            message: `You have been invited to collaborate on "${novelData.title}" as a ${selectedRole}`,
            data: {
              novel_id: novelId,
              novel_title: novelData.title,
              role: selectedRole,
              inviter_id: session?.user.id,
              inviter_name: session?.user.name
            }
          }
        ]);

      setCollaborators(prev => [...prev, newCollaborator]);
      setIsInviteDialogOpen(false);
      setSelectedFriendId("");
      setSelectedRole("viewer");
      
      toast.success("Collaborator added", {
        description: "Your friend has been added as a collaborator",
      });
    } catch (error) {
      console.error("Error adding collaborator:", error);
      toast.error("Failed to add collaborator");
    }
  };

  const handleRemoveCollaborator = async () => {
    if (!selectedCollaboratorId) return;

    try {
      // Get the collaborator to remove
      const collaboratorToRemove = collaborators.find(c => c.id === selectedCollaboratorId);
      if (!collaboratorToRemove) {
        throw new Error("Collaborator not found");
      }
      
      // Delete the collaborator record
      const { error } = await supabase
        .from("novel_collaborators")
        .delete()
        .eq("id", selectedCollaboratorId);

      if (error) throw error;

      // Fetch novel details for the notification
      const { data: novelData, error: novelError } = await supabase
        .from("novels")
        .select("title")
        .eq("id", novelId)
        .single();
        
      if (novelError) throw novelError;

      // Send notification to the removed collaborator
      await supabase
        .from("notifications")
        .insert([
          {
            user_id: collaboratorToRemove.collaborator_id,
            type: "collaboration_removed",
            title: "Collaboration Ended",
            message: `You have been removed from collaborating on "${novelData.title}"`,
            data: {
              novel_id: novelId,
              novel_title: novelData.title,
              remover_id: session?.user.id,
              remover_name: session?.user.name
            }
          }
        ]);

      // Update the state
      setCollaborators(prev => prev.filter(c => c.id !== selectedCollaboratorId));
      setIsRemoveDialogOpen(false);
      setSelectedCollaboratorId(null);
      
      toast.success("Collaborator removed", {
        description: "Collaborator has been removed successfully",
      });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      toast.error("Failed to remove collaborator");
    }
  };

  const handleEditRole = async () => {
    if (!editingCollaborator) return;

    try {
      // Update the role for this specific collaborator
      const { error } = await supabase
        .from("novel_collaborators")
        .update({ role: newRole })
        .eq("id", editingCollaborator.id);

      if (error) throw error;

      // Fetch novel details for the notification
      const { data: novelData, error: novelError } = await supabase
        .from("novels")
        .select("title")
        .eq("id", novelId)
        .single();
        
      if (novelError) throw novelError;

      // Send notification about role change
      await supabase
        .from("notifications")
        .insert([
          {
            user_id: editingCollaborator.collaborator_id,
            type: "collaboration_role_changed",
            title: "Collaboration Role Updated",
            message: `Your role for "${novelData.title}" has been changed to ${newRole}`,
            data: {
              novel_id: novelId,
              novel_title: novelData.title,
              old_role: editingCollaborator.role,
              new_role: newRole,
              updater_id: session?.user.id,
              updater_name: session?.user.name
            }
          }
        ]);

      // Update the specific collaborator with the new role
      setCollaborators(prev => 
        prev.map(c => c.id === editingCollaborator.id ? { ...c, role: newRole } : c)
      );
      
      setIsEditRoleDialogOpen(false);
      setEditingCollaborator(null);
      
      toast.success("Role updated", {
        description: `Collaborator role updated to ${newRole}`,
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update collaborator role");
    }
  };

  const filteredFriends = friends.filter(friend => {
    const searchLower = searchQuery.toLowerCase();
    return friend.user_name.toLowerCase().includes(searchLower);
  });

  const filteredCollaborators = collaborators.filter(collab => {
    const searchLower = searchQuery.toLowerCase();
    return (
      collab.user?.user_name?.toLowerCase().includes(searchLower) ||
      collab.user?.user_email?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-6">
      <Card className="p-6 border-2 border-gradient-to-r from-violet-500/20 via-blue-500/20 to-teal-500/20 bg-background">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500">
              Collaborators
            </h2>
            <p className="text-sm text-muted-foreground">
              Invite friends to collaborate on your novel
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search collaborators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 h-10 w-full"
              />
            </div>
            
            <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Invite Collaborator
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite a Friend as Collaborator</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Select Friend</label>
                    <Select value={selectedFriendId} onValueChange={setSelectedFriendId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a friend" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredFriends.map(friend => (
                          <SelectItem key={friend.user_id} value={friend.user_id}>
                            <div className="flex items-center gap-2">
                              <UserAvatar
                                userId={friend.user_id}
                                userName={friend.user_name}
                                avatarUrl={friend.avatar_url}
                                size="sm"
                              />
                              <span>{friend.user_name}</span>
                            </div>
                          </SelectItem>
                        ))}
                        {filteredFriends.length === 0 && (
                          <div className="p-2 text-center text-sm text-muted-foreground">
                            No friends found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Select value={selectedRole} onValueChange={(value: "editor" | "viewer") => setSelectedRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer (can read only)</SelectItem>
                        <SelectItem value="editor">Editor (can edit)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Editors can make changes to your novel, while viewers can only read it.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleInviteCollaborator}>
                    Invite Collaborator
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-2">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Users className="h-8 w-8 text-primary" />
              </motion.div>
              <p className="text-sm text-muted-foreground">Loading collaborators...</p>
            </div>
          </div>
        ) : (
          <>
            {collaborators.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">No collaborators yet</h3>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Invite your friends to collaborate on your novel. They can help you edit, review, and improve your story.
                  </p>
                  <Button 
                    onClick={() => setIsInviteDialogOpen(true)}
                    className="mt-2"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Collaborator
                  </Button>
                </div>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  {filteredCollaborators.map((collaborator) => (
                    <motion.div
                      key={collaborator.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-all duration-300"
                    >
                      <div className="flex items-center gap-4">
                        <UserAvatar
                          userId={collaborator.collaborator_id}
                          userName={collaborator.user?.user_name || ""}
                          avatarUrl={collaborator.user?.avatar_url || null}
                          size="md"
                        />
                        <div>
                          <p className="font-medium">{collaborator.user?.user_name || ""}</p>
                          <p className="text-sm text-muted-foreground">
                            {collaborator.user?.user_email || ""}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant={collaborator.role === "editor" ? "default" : "outline"}
                              className={collaborator.role === "editor" 
                                ? "bg-blue-500 hover:bg-blue-600" 
                                : ""}
                            >
                              {collaborator.role === "editor" ? "Editor" : "Viewer"}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              Added {format(new Date(collaborator.created_at), "MMM d, yyyy")}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingCollaborator(collaborator);
                                  setNewRole(collaborator.role);
                                  setIsEditRoleDialogOpen(true);
                                }}
                              >
                                <Edit className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Edit role</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedCollaboratorId(collaborator.id);
                                  setIsRemoveDialogOpen(true);
                                }}
                              >
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Remove collaborator</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </>
        )}
      </Card>
      
      {/* Edit Role Dialog */}
      <Dialog open={isEditRoleDialogOpen} onOpenChange={setIsEditRoleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Collaborator Role</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 mb-4">
              <UserAvatar
                userId={editingCollaborator?.collaborator_id || ""}
                userName={editingCollaborator?.user?.user_name || ""}
                avatarUrl={editingCollaborator?.user?.avatar_url || null}
                size="md"
              />
              <div>
                <p className="font-medium">{editingCollaborator?.user?.user_name || ""}</p>
                <p className="text-sm text-muted-foreground">
                  {editingCollaborator?.user?.user_email || ""}
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={newRole} onValueChange={(value: "editor" | "viewer") => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer (can read only)</SelectItem>
                  <SelectItem value="editor">Editor (can edit)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Editors can make changes to your novel, while viewers can only read it.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditRoleDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditRole}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Remove Collaborator Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Collaborator</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this collaborator? They will no longer have access to your novel.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemoveCollaborator} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* No Friends Dialog */}
      {friends.length === 0 && (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="hidden">Open</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>No Friends Found</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex flex-col items-center gap-3 py-4">
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-amber-500" />
                </div>
                <h3 className="text-lg font-medium text-center">You don&apos;t have any friends yet</h3>
                <p className="text-sm text-muted-foreground text-center max-w-md">
                  Connect with other users in Tale Tethers to invite them as collaborators for your novel.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button asChild>
                <a href="/tale-tethers">Go to Tale Tethers</a>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
