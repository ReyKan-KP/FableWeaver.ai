import { createServerSupabaseClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";
import { formatDistance } from "date-fns";

export default async function NovelPage({
  params,
}: {
  params: { novelId: string };
}) {
  const supabase = createServerSupabaseClient();

  const { data: novel, error } = await supabase
    .from("novels")
    .select("*")
    .eq("id", params.novelId)
    .single();

  if (error || !novel) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg overflow-hidden">
          <div className="relative h-64 md:h-96">
            <Image
              src={novel.cover_image || "/images/default-cover.png"}
              alt={novel.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="p-6 md:p-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{novel.title}</h1>
                <div className="flex gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-100 dark:bg-zinc-800">
                    {novel.genre}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      novel.is_published
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100"
                    }`}
                  >
                    {novel.is_published ? "Published" : "Draft"}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      novel.is_public
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {novel.is_public ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            </div>

            <div className="prose dark:prose-invert max-w-none mb-8">
              <p>{novel.description}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Chapters
                </div>
                <div className="text-xl font-semibold">
                  {novel.chapter_count}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Total Words
                </div>
                <div className="text-xl font-semibold">
                  {novel.total_words.toLocaleString()}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Created
                </div>
                <div className="text-xl font-semibold">
                  {formatDistance(new Date(novel.created_at), new Date(), {
                    addSuffix: true,
                  })}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-zinc-800 p-4 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Last Updated
                </div>
                <div className="text-xl font-semibold">
                  {formatDistance(new Date(novel.updated_at), new Date(), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
