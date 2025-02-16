"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, MoreVertical, Ban, Edit, Trash } from "lucide-react";
import { formatDistance } from "date-fns";
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
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface User {
  user_id: string;
  user_name: string;
  user_email: string;
  avatar_url: string | null;
  created_at: string;
  is_active: boolean;
  role: string;
}

interface UserFormData {
  user_name: string;
  user_email: string;
  role: string;
  is_active: boolean;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>({
    user_name: "",
    user_email: "",
    role: "user",
    is_active: true,
  });
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("user")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.user_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleStatusToggle = async (user: User) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("user")
        .update({ is_active: !user.is_active })
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast.success(
        `User ${user.is_active ? "deactivated" : "activated"} successfully`
      );
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (user: User) => {
    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from("user")
        .delete()
        .eq("user_id", user.user_id);

      if (error) throw error;

      toast.success("User deleted successfully");
      fetchUsers(); // Refresh the users list
    } catch (error) {
      console.error("Error deleting user:", error);
      toast.error("Failed to delete user");
    } finally {
      setIsUpdating(false);
      setUserToDelete(null);
    }
  };

  const resetForm = () => {
    setFormData({
      user_name: "",
      user_email: "",
      role: "user",
      is_active: true,
    });
    setUserToEdit(null);
  };

  const handleDialogOpen = (user?: User) => {
    if (user) {
      setUserToEdit(user);
      setFormData({
        user_name: user.user_name,
        user_email: user.user_email,
        role: user.role,
        is_active: user.is_active,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsUpdating(true);

      if (userToEdit) {
        // Update existing user
        const { error } = await supabase
          .from("user")
          .update({
            user_name: formData.user_name,
            user_email: formData.user_email,
            role: formData.role,
            is_active: formData.is_active,
          })
          .eq("user_id", userToEdit.user_id);

        if (error) throw error;
        toast.success("User updated successfully");
      } else {
        // Create new user
        const { error } = await supabase.from("user").insert([
          {
            user_name: formData.user_name,
            user_email: formData.user_email,
            role: formData.role,
            is_active: formData.is_active,
          },
        ]);

        if (error) throw error;
        toast.success("User created successfully");
      }

      handleDialogClose();
      fetchUsers();
    } catch (error) {
      console.error("Error saving user:", error);
      toast.error("Failed to save user");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Users</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <Button onClick={() => handleDialogOpen()}>Add User</Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              {/* <TableHead>Role</TableHead> */}
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.user_id}>
                <TableCell className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar_url || ""} />
                    <AvatarFallback>
                      {user.user_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.user_name}</div>
                    <div className="text-sm text-gray-500">
                      {user.user_email}
                    </div>
                  </div>
                </TableCell>
                {/* <TableCell>{user.role}</TableCell> */}
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      user.is_active
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {user.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  {formatDistance(new Date(user.created_at), new Date(), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDialogOpen(user)}>
                        <Edit className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusToggle(user)}
                        disabled={isUpdating}
                      >
                        <Ban className="h-4 w-4 mr-2" />
                        {user.is_active ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => setUserToDelete(user)}
                      >
                        <Trash className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={() => setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              user account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => userToDelete && handleDelete(userToDelete)}
              className="bg-red-600 hover:bg-red-700"
              disabled={isUpdating}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userToEdit ? "Edit User" : "Add New User"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="user_name">Name</Label>
                <Input
                  id="user_name"
                  value={formData.user_name}
                  onChange={(e) =>
                    setFormData({ ...formData, user_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user_email">Email</Label>
                <Input
                  id="user_email"
                  type="email"
                  value={formData.user_email}
                  onChange={(e) =>
                    setFormData({ ...formData, user_email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <select
                  id="role"
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="moderator">Moderator</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="rounded border-gray-300"
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {userToEdit ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
