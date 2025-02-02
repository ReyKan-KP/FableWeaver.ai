import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { AnimatedContent } from "./_components/animated-content";
import ProfileLoading from "./loading";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/10 py-8 px-4 sm:px-6 lg:px-8">
      <AnimatedContent
        user={{
          id: session.user.id,
          name: session.user.name || "",
          email: session.user.email || "",
          image: session.user.image || "",
        }}
      />
    </div>
  );
}
