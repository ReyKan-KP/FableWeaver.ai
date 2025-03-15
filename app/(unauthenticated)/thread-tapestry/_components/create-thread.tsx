"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Image as ImageIcon,
  Hash,
  X,
  Plus,
  Loader2,
  Upload,
  Sparkles,
  Info,
  User as UserIcon
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { threadService } from '@/lib/services/threads';
import { useRouter } from 'next/navigation';
import AIFeatures from "./ai-features";


export default function CreateThread() {
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    "discussion",
    "question",
    "announcement",
    "story",
    "art",
    "gaming",
    "technology"
  ];

  const handleAddTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      if (tags.length >= 5) {
        toast.error("Maximum tags reached", {
          description: "You can only add up to 5 tags per thread."
        });
        return;
      }
      if (trimmedTag.length > 20) {
        toast.error("Tag too long", {
          description: "Tags must be 20 characters or less."
        });
        return;
      }
      setTags([...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages: File[] = [];
    const newPreviews: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          toast.error("File too large", {
            description: "Please upload images smaller than 5MB."
          });
          continue;
        }
        newImages.push(file);
        newPreviews.push(URL.createObjectURL(file));
      } else {
        toast.error("Invalid file type", {
          description: "Please upload only image files."
        });
      }
    }

    setImages([...images, ...newImages]);
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImages(images.filter((_, i) => i !== index));
    setImagePreviews(imagePreviews.filter((_, i) => i !== index));
  };

  const handleEnhancedContent = (enhancedContent: string) => {
    setContent(enhancedContent);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content || !category) {
      toast.error("Missing required fields", {
        description: "Please fill in all required fields."
      });
      return;
    }

    if (!user?.id) {
      toast.error("Authentication required", {
        description: "Please sign in to create a thread."
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload images first
      const imageUrls: string[] = [];
      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        // Use a more reliable ID format
        const userId = String(user.id).replace(/[^a-zA-Z0-9]/g, '_');
        const path = `${userId}/${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        await threadService.uploadImage(file, path);
        const url = await threadService.getImageUrl(path);
        imageUrls.push(url);
      }

      // Create thread with properly formatted tags
      const threadData = {
        user_id: user.id,
        title,
        content,
        category,
        tags: tags.length > 0 ? tags.map(tag => tag.trim().toLowerCase()) : [],
        images: imageUrls,
        status: 'active'
      } as const;

      await threadService.createThread(threadData);

      toast.success("Thread created successfully", {
        description: "Your thread has been published."
      });

      // Reset form
      setTitle("");
      setContent("");
      setCategory("");
      setTags([]);
      setImages([]);
      imagePreviews.forEach(preview => URL.revokeObjectURL(preview));
      setImagePreviews([]);

      // Redirect to the thread list
      router.push('/thread-tapestry');
    } catch (error) {
      console.error('Error creating thread:', error);
      toast.error("Error creating thread", {
        description: "Something went wrong. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-6 rounded-lg">
        <div className="flex items-center gap-3 mb-6">
          <Avatar className="w-10 h-10 ring-2 ring-white dark:ring-gray-800">
            <AvatarImage 
              src={user?.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} 
              alt={user?.name || "User"} 
            />
            <AvatarFallback className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
              <UserIcon className="w-5 h-5" />
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{user?.name || `User ${user?.id?.slice(0, 4)}`}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Creating a new thread</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Title</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Give your thread an engaging title
                </div>
              </div>
            </div>
            <Input
              placeholder="Give your thread a title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              required
            />
          </div>

          {/* Content Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Content</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-wrap z-50">
                  Write your thread content here. You can use markdown for formatting.
                </div>
              </div>
            </div>
            <Textarea
              placeholder="Write your thread content here..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[200px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              required
            />
            {content && <AIFeatures content={content} onEnhancedContent={handleEnhancedContent} />}
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Category</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Select a category for your thread
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <motion.button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                    category === cat
                      ? "bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white shadow-md"
                      : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Tags Input */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Tags</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Add tags to help others discover your thread
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-gradient-to-r from-violet-100 via-blue-100 to-teal-100 dark:from-violet-900/30 dark:via-blue-900/30 dark:to-teal-900/30 text-violet-800 dark:text-violet-300"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full hover:shadow-lg transform transition-all duration-300"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-gray-100">Images</label>
              <div className="group relative">
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  Add images to enhance your thread (max 5MB each)
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <motion.div
                  key={index}
                  className="relative aspect-square rounded-lg overflow-hidden group"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Image
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
              {imagePreviews.length < 4 && (
                <motion.button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="text-center">
                    <ImageIcon className="w-8 h-8 mx-auto text-gray-400 dark:text-gray-500" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Add Image</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    multiple
                  />
                </motion.button>
              )}
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={isSubmitting}
            className="w-full p-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 hover:from-violet-600 hover:via-blue-600 hover:to-teal-600 text-white rounded-lg 
            hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 
            flex items-center justify-center gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Create Thread
              </>
            )}
          </motion.button>
        </form>
      </Card>
    </motion.div>
  );
} 