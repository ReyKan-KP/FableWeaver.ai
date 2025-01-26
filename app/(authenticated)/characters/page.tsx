"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Character {
  id: string;
  name: string;
  description: string;
  content_source: string;
  is_public: boolean;
  is_active: boolean;
  creator_id: string;
  created_at: string;
}

export default function CharactersPage() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "mine" | "public">("all");
    const { data: session, status } = useSession();
    const user = session?.user;

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
    switch (filter) {
      case "mine":
        return character.creator_id === user?.id;
      case "public":
        return character.is_public;
      default:
        return character.is_public || character.creator_id === user?.id;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Characters</h1>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1 rounded ${
                filter === "all"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter("public")}
              className={`px-3 py-1 rounded ${
                filter === "public"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              Public
            </button>
            <button
              onClick={() => setFilter("mine")}
              className={`px-3 py-1 rounded ${
                filter === "mine"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-200 hover:bg-gray-300"
              }`}
            >
              My Characters
            </button>
          </div>
        </div>
        <Link
          href="/create-character"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Create New Character
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredCharacters.map((character) => (
          <div
            key={character.id}
            className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-semibold">{character.name}</h2>
                <div className="flex gap-2">
                  {character.is_public && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                      Public
                    </span>
                  )}
                  {character.creator_id === user?.id && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Mine
                    </span>
                  )}
                </div>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {character.description}
              </p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  From: {character.content_source}
                </span>
                <Link
                  href={`/chatbot/${character.id}`}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Chat Now
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredCharacters.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">
            {filter === "mine"
              ? "You haven't created any characters yet."
              : "No characters found."}
          </p>
          <Link
            href="/create-character"
            className="mt-4 inline-block px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Create Your First Character
          </Link>
        </div>
      )}
    </div>
  );
}
