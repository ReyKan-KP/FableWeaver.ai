"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sparkles,
  Upload,
  X,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Info,
} from "lucide-react";
import Image from "next/image";
import type { Message, Character } from "@/types/chat";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";
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
import { useToast } from "@/hooks/use-toast";

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine" | "public">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(
    null
  );
  const { data: session, status } = useSession();
  const user = session?.user;
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const fetchCharacters = async () => {
      try {
        const response = await fetch("/api/characters");
        const data = await response.json();
        setCharacters(data);
      } catch (error) {
        console.error("Error fetching characters:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCharacters();
  }, []);

  const filteredCharacters = characters.filter((character) => {
    const matchesFilter =
      filter === "all"
        ? character.is_public || character.creator_id === user?.id
        : filter === "mine"
        ? character.creator_id === user?.id
        : character.is_public;

    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      searchQuery === "" ||
      character.name.toLowerCase().includes(searchLower) ||
      character.description.toLowerCase().includes(searchLower) ||
      character.content_source.toLowerCase().includes(searchLower) ||
      (character.content_types &&
        character.content_types.some((type) =>
          type.toLowerCase().includes(searchLower)
        ));

    return matchesFilter && matchesSearch;
  });

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  const handleEditClick = (character: Character) => {
    setEditingCharacter(character);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (character: Character) => {
    setCharacterToDelete(character);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!characterToDelete) return;

    try {
      const response = await fetch(`/api/characters/${characterToDelete.id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setCharacters(characters.filter((c) => c.id !== characterToDelete.id));
        toast({
          title: "Character deleted",
          description: "The character has been successfully deleted.",
        });
      } else {
        throw new Error("Failed to delete character");
      }
    } catch (error) {
      console.error("Error deleting character:", error);
      toast({
        title: "Error",
        description: "Failed to delete character. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setCharacterToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
        <div className="relative w-12 h-12">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-200 dark:border-blue-800 rounded-full animate-ping"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-blue-500 dark:border-blue-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
              Character Realm
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Discover and interact with unique characters
            </p>
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <button
                  className="px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full 
                  hover:shadow-lg transform transition-all duration-300 font-semibold flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Weave New Character
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <CreateCharacterForm
                  onSuccess={() => {
                    setIsDialogOpen(false);
                    router.refresh();
                  }}
                />
              </DialogContent>
            </Dialog>
          </motion.div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <motion.div
            className="relative flex-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search characters..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 
              focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent 
              transition-all duration-300 bg-white dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-400"
            />
          </motion.div>
          <motion.div
            className="flex gap-2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {["all", "public", "mine"].map((filterType) => (
              <motion.button
                key={filterType}
                onClick={() => setFilter(filterType as typeof filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "px-4 py-2 rounded-full transition-all duration-300",
                  filter === filterType
                    ? "bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white shadow-md"
                    : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                )}
              >
                {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
              </motion.button>
            ))}
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
      >
        {filteredCharacters.map((character) => (
          <motion.div
            key={character.id}
            variants={item}
            whileHover={{ scale: 1.02 }}
            className="bg-[#bccff1] dark:bg-zinc-900 rounded-xl shadow-md overflow-hidden hover:shadow-xl 
            transition-all duration-300 border border-gray-100 dark:border-gray-700"
          >
            <div className="relative h-48 w-full p-[1px]">
              <div className="absolute inset-0 bg-dot-white/[0.2] dark:bg-dot-black/[0.2]"></div>
              <Image
                src={character.image_url || "/images/default-character.png"}
                alt={character.name}
                className="w-full h-full object-contain "
                width={500}
                height={500}
              />
            </div>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold bg-gradient-to-r from-violet-600 via-blue-600 to-teal-500 bg-clip-text text-transparent">
                  {character.name}
                </h2>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-1 justify-end">
                    {character.content_types &&
                      character.content_types.map(
                        (type, index) =>
                          type && (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 
                          text-purple-800 dark:text-purple-300 rounded-full whitespace-nowrap"
                            >
                              {type}
                            </span>
                          )
                      )}
                  </div>
                  <div className="flex gap-1 justify-end">
                    {character.is_public && (
                      <span className="px-3 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full">
                        Public
                      </span>
                    )}
                    {character.creator_id === user?.id && (
                      <>
                        <span className="px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">
                          Mine
                        </span>
                        <div className="flex gap-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.preventDefault();
                              handleEditClick(character);
                            }}
                            className="p-1 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 
                            bg-blue-100 dark:bg-blue-900/30 rounded-full transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.preventDefault();
                              handleDeleteClick(character);
                            }}
                            className="p-1 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 
                            bg-red-100 dark:bg-red-900/30 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 min-h-[3rem]">
                {character.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400 italic">
                  From: {character.content_source}
                </span>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={`/chatbot/${character.id}`}
                    className="px-4 py-2 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white 
                    rounded-full hover:shadow-lg transform transition-all duration-300"
                  >
                    Chat Now
                  </Link>
                </motion.div>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filteredCharacters.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-12"
        >
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-md mx-auto">
            <p className="text-gray-600 dark:text-gray-300 text-lg mb-4">
              {filter === "mine"
                ? "You haven't created any characters yet."
                : "No characters found."}
            </p>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                href="/create-character"
                className="inline-block px-6 py-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 
                text-white rounded-full hover:shadow-lg transform transition-all duration-300"
              >
                Create Your First Character
              </Link>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* Edit Character Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {editingCharacter && (
            <CreateCharacterForm
              initialData={editingCharacter}
              onSuccess={() => {
                setIsEditDialogOpen(false);
                router.refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              character and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface CreateCharacterFormProps {
  initialData?: Character;
  onSuccess: () => void;
}

const CreateCharacterForm = ({
  initialData,
  onSuccess,
}: CreateCharacterFormProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [characterImage, setCharacterImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(
    initialData?.image_url || ""
  );
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();
  const user = session?.user;
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    character_name: "",
    character_description: "",
    content_source: "",
    content_types: [""],
    fandom_url: "",
    dialogues: [""],
    is_public: true,
  });

  useEffect(() => {
    if (initialData) {
      console.log("Initial Data:", initialData);
      setFormData({
        character_name: initialData.name || "",
        character_description: initialData.description || "",
        content_source: initialData.content_source || "",
        content_types:
          Array.isArray(initialData.content_types) &&
          initialData.content_types.length > 0
            ? initialData.content_types
            : [""],
        fandom_url: initialData.fandom_url || "",
        dialogues:
          Array.isArray(initialData.dialogues) &&
          initialData.dialogues.length > 0
            ? initialData.dialogues
            : [""],
        is_public: initialData.is_public ?? true,
      });
      setImagePreview(initialData.image_url || "");
    }
  }, [initialData]);

  // Add console log to debug form data changes
  useEffect(() => {
    console.log("Form Data:", formData);
  }, [formData]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCharacterImage(file);
      setImagePreview(URL.createObjectURL(file));
      setRemoveImage(false);
    }
  };

  const handleRemoveImage = () => {
    setCharacterImage(null);
    setImagePreview("");
    setRemoveImage(true);
  };

  const handleContentTypeChange = (index: number, value: string) => {
    const newContentTypes = [...formData.content_types];
    newContentTypes[index] = value;
    setFormData({ ...formData, content_types: newContentTypes });
  };

  const addContentType = () => {
    setFormData({
      ...formData,
      content_types: [...formData.content_types, ""],
    });
  };

  const handleDialogueChange = (index: number, value: string) => {
    const newDialogues = [...formData.dialogues];
    newDialogues[index] = value;
    setFormData({ ...formData, dialogues: newDialogues });
  };

  const addDialogue = () => {
    setFormData({
      ...formData,
      dialogues: [...formData.dialogues, ""],
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create a character",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("user_id", user.id);
      formDataToSend.append("character_name", formData.character_name);
      formDataToSend.append(
        "character_description",
        formData.character_description
      );
      formDataToSend.append("content_source", formData.content_source);
      formDataToSend.append(
        "content_types",
        JSON.stringify(formData.content_types.filter(Boolean))
      );
      formDataToSend.append("fandom_url", formData.fandom_url);
      formDataToSend.append(
        "dialogues",
        JSON.stringify(formData.dialogues.filter(Boolean))
      );
      formDataToSend.append("is_public", formData.is_public.toString());

      if (characterImage) {
        formDataToSend.append("character_image", characterImage);
      }

      if (removeImage) {
        formDataToSend.append("removeImage", "true");
      }

      const url = initialData
        ? `/api/characters/${initialData.id}`
        : "/api/create-character";

      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        body: formDataToSend,
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.id) {
        toast({
          title: initialData ? "Character updated" : "Character created",
          description: initialData
            ? "Your character has been successfully updated."
            : "Your new character has been created successfully.",
        });
        onSuccess();
      }
    } catch (error) {
      console.error("Error saving character:", error);
      toast({
        title: "Error",
        description: "Failed to save character. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const tooltips = {
    characterName:
      "Enter the name of your character (e.g., 'Harry Potter', 'Tony Stark')",
    description:
      "Provide a detailed description of your character's personality, background, and notable traits",
    contentSource:
      "Specify the original source material (e.g., 'Harry Potter Series', 'Marvel Comics')",
    contentTypes:
      "Add categories that describe your character (e.g., 'movie', 'anime', 'web novel')",
    fandomUrl:
      "Add a link to more information about your character (e.g., Wiki page)",
    dialogues:
      "Add example  quotes that capture your character's speaking style",
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <motion.div
        className="flex flex-col items-center space-y-4 p-6 bg-[#bccff1] dark:bg-zinc-900 rounded-lg"
        whileHover={{ scale: 1.02 }}
      >
        <motion.div className="relative" whileHover={{ scale: 1.05 }}>
          <Avatar className="h-32 w-32 ring-2 ring-white dark:ring-gray-800">
            <AvatarImage src={imagePreview} />
            <AvatarFallback className="bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white">
              {formData.character_name?.[0]?.toUpperCase() || "C"}
            </AvatarFallback>
          </Avatar>
          {imagePreview && (
            <motion.button
              type="button"
              onClick={handleRemoveImage}
              className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="h-4 w-4" />
            </motion.button>
          )}
        </motion.div>
        <motion.div
          className="flex items-center space-x-2"
          whileHover={{ scale: 1.05 }}
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 text-white rounded-full hover:shadow-lg 
            transition-all duration-300 flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Upload Character Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
        </motion.div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Recommended: Square image, at least 300x300px
        </p>
      </motion.div>

      <motion.div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-gray-700 dark:text-gray-300">
              Character Name
            </label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {tooltips.characterName}
              </div>
            </div>
          </div>
          <motion.input
            type="text"
            value={formData.character_name}
            onChange={(e) =>
              setFormData({ ...formData, character_name: e.target.value })
            }
            className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:text-gray-200"
            required
            whileHover={{ scale: 1.01 }}
            whileFocus={{ scale: 1.02 }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-gray-700 dark:text-gray-300">
              Description
            </label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-wrap z-50">
                {tooltips.description}
              </div>
            </div>
          </div>
          <motion.textarea
            value={formData.character_description}
            onChange={(e) =>
              setFormData({
                ...formData,
                character_description: e.target.value,
              })
            }
            className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:text-gray-200"
            rows={4}
            required
            whileHover={{ scale: 1.01 }}
            whileFocus={{ scale: 1.02 }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-gray-700 dark:text-gray-300">
              Content Source
            </label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {tooltips.contentSource}
              </div>
            </div>
          </div>
          <motion.input
            type="text"
            value={formData.content_source}
            onChange={(e) =>
              setFormData({ ...formData, content_source: e.target.value })
            }
            className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:text-gray-200"
            required
            whileHover={{ scale: 1.01 }}
            whileFocus={{ scale: 1.02 }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-gray-700 dark:text-gray-300">
              Content Types
            </label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {tooltips.contentTypes}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {formData.content_types.map((type, index) => (
              <motion.div
                key={index}
                className="flex gap-2 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <motion.input
                  type="text"
                  value={type}
                  onChange={(e) =>
                    handleContentTypeChange(index, e.target.value)
                  }
                  className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:text-gray-200"
                  whileHover={{ scale: 1.01 }}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            type="button"
            onClick={addContentType}
            className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Add Content Type
          </motion.button>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-gray-700 dark:text-gray-300">
              Fandom URL
            </label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {tooltips.fandomUrl}
              </div>
            </div>
          </div>
          <motion.input
            type="url"
            value={formData.fandom_url}
            onChange={(e) =>
              setFormData({ ...formData, fandom_url: e.target.value })
            }
            className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:text-gray-200"
            whileHover={{ scale: 1.01 }}
            whileFocus={{ scale: 1.02 }}
          />
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-gray-700 dark:text-gray-300">
              Dialogues
            </label>
            <div className="group relative">
              <Info className="w-4 h-4 text-gray-400 cursor-help" />
              <div className="absolute left-1/4 -translate-x-1/4 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                {tooltips.dialogues}
              </div>
            </div>
          </div>
          <AnimatePresence>
            {formData.dialogues.map((dialogue, index) => (
              <motion.div
                key={index}
                className="flex gap-2 mb-2"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <motion.input
                  type="text"
                  value={dialogue}
                  onChange={(e) => handleDialogueChange(index, e.target.value)}
                  className="flex-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:text-gray-200"
                  whileHover={{ scale: 1.01 }}
                  whileFocus={{ scale: 1.02 }}
                />
              </motion.div>
            ))}
          </AnimatePresence>
          <motion.button
            type="button"
            onClick={addDialogue}
            className="text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 transition-colors flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Add Dialogue
          </motion.button>
        </div>

        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
        >
          <input
            type="checkbox"
            checked={formData.is_public}
            onChange={(e) =>
              setFormData({ ...formData, is_public: e.target.checked })
            }
            className="w-4 h-4 text-blue-500 dark:text-blue-400 border-gray-300 dark:border-gray-700 rounded focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <label className="text-gray-700 dark:text-gray-300">
            Make this character public
          </label>
        </motion.div>
      </motion.div>

      <motion.button
        type="submit"
        disabled={isLoading}
        className="w-full p-3 bg-gradient-to-r from-violet-500 via-blue-500 to-teal-500 hover:from-violet-600 hover:via-blue-600 hover:to-teal-600 text-white rounded-lg 
        hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 
        flex items-center justify-center gap-2"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {initialData ? "Refining..." : "Weaving..."}
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {initialData ? "Refine Character" : "Weave Character"}
          </>
        )}
      </motion.button>
    </motion.form>
  );
};
