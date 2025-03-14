"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { FriendChat } from "./friend-chat";

interface FriendChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: {
    user_id: string;
    user_name: string;
    avatar_url: string;
    is_active: boolean;
  };
}

export const FriendChatModal = ({ isOpen, onClose, friend }: FriendChatModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 h-[90vh] md:h-[80vh]">
        <FriendChat friend={friend} onBack={onClose} />
      </DialogContent>
    </Dialog>
  );
}; 