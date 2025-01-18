// "use client";

// import { useEffect, useState } from "react";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { motion } from "framer-motion";
// import { AnimeRecommendation } from "@/lib/types";
// import { Loader2 } from "lucide-react";
// import { createClient } from "@supabase/supabase-js";
// import Image from "next/image";
// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// export function WatchedAnimeList({ watchedList }: { watchedList: string[] }) {
//   const [animes, setAnimes] = useState<AnimeRecommendation[]>([]);
//   const [loading, setLoading] = useState(true);
//   const supabase = createClient(supabaseUrl, supabaseKey);

//   useEffect(() => {
//     async function fetchWatchedAnimes() {
//       if (!watchedList?.length) {
//         setLoading(false);
//         return;
//       }

//       const { data, error } = await supabase
//         .from("anime")
//         .select("*")
//         .in("id", watchedList);

//       if (!error && data) {
//         setAnimes(data);
//       }
//       setLoading(false);
//     }

//     fetchWatchedAnimes();
//   }, [watchedList]);

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: 20 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ duration: 0.5 }}
//     >
//       <Card className="bg-white dark:bg-gray-800">
//         <CardHeader>
//           <CardTitle>Watched Anime</CardTitle>
//           <CardDescription>Your watched anime collection</CardDescription>
//         </CardHeader>
//         <CardContent>
//           {loading ? (
//             <div className="flex justify-center p-4">
//               <Loader2 className="h-6 w-6 animate-spin" />
//             </div>
//           ) : animes.length > 0 ? (
//             <div className="space-y-4">
//               {animes.map((anime) => (
//                 <motion.div
//                   key={anime.id}
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
//                 >
//                   <div className="relative w-16 h-16">
//                     {anime.image_url ? (
//                       <Image
//                         src={anime.image_url}
//                         alt={anime.title}
//                         fill
//                         className="object-cover rounded"
//                         sizes="64px"
//                       />
//                     ) : (
//                       <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
//                         <span className="text-xs text-gray-400 dark:text-gray-500">
//                           No Image
//                         </span>
//                       </div>
//                     )}
//                   </div>
//                   <div>
//                     <h3 className="font-medium">{anime.title}</h3>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">
//                       {anime.year} • {anime.rating.toFixed(1)} ★
//                     </p>
//                   </div>
//                 </motion.div>
//               ))}
//             </div>
//           ) : (
//             <p className="text-center text-gray-500 dark:text-gray-400">
//               No watched anime yet
//             </p>
//           )}
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// }
