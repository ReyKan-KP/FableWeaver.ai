"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { useUser } from "@supabase/auth-helpers-react";
import { useSession } from "next-auth/react";

export default function CreateCharacterPage() {
    const router = useRouter();
    const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      router.push("/sign-in");
    },
  });
  const user = session?.user;
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    character_name: "",
    character_description: "",
    content_source: "",
    content_types: [""],
    fandom_url: "",
    dialogues: [""],
    is_public: true,
  });

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
      alert("Please sign in to create a character");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/create-character", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          character_name: formData.character_name,
          character_description: formData.character_description,
          content_source: formData.content_source,
          content_types: formData.content_types.filter(Boolean),
          fandom_url: formData.fandom_url,
          dialogues: formData.dialogues.filter(Boolean),
          is_public: formData.is_public,
        }),
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      if (data.id) {
        router.push(`/chatbot/${data.id}`);
      }
    } catch (error) {
      console.error("Error creating character:", error);
      alert("Failed to create character. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create Character Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-2">Character Name</label>
          <input
            type="text"
            value={formData.character_name}
            onChange={(e) =>
              setFormData({ ...formData, character_name: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Description</label>
          <textarea
            value={formData.character_description}
            onChange={(e) =>
              setFormData({
                ...formData,
                character_description: e.target.value,
              })
            }
            className="w-full p-2 border rounded"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block mb-2">Content Source</label>
          <input
            type="text"
            value={formData.content_source}
            onChange={(e) =>
              setFormData({ ...formData, content_source: e.target.value })
            }
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">Content Types</label>
          {formData.content_types.map((type, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={type}
                onChange={(e) => handleContentTypeChange(index, e.target.value)}
                className="flex-1 p-2 border rounded"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={addContentType}
            className="text-blue-500"
          >
            + Add Content Type
          </button>
        </div>

        <div>
          <label className="block mb-2">Fandom URL (optional)</label>
          <input
            type="url"
            value={formData.fandom_url}
            onChange={(e) =>
              setFormData({ ...formData, fandom_url: e.target.value })
            }
            className="w-full p-2 border rounded"
          />
        </div>

        <div>
          <label className="block mb-2">Dialogues</label>
          {formData.dialogues.map((dialogue, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={dialogue}
                onChange={(e) => handleDialogueChange(index, e.target.value)}
                className="flex-1 p-2 border rounded"
              />
            </div>
          ))}
          <button type="button" onClick={addDialogue} className="text-blue-500">
            + Add Dialogue
          </button>
        </div>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_public}
              onChange={(e) =>
                setFormData({ ...formData, is_public: e.target.checked })
              }
              className="mr-2"
            />
            Make this character public
          </label>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
        >
          {isLoading ? "Creating..." : "Create Character"}
        </button>
      </form>
    </div>
  );
}
