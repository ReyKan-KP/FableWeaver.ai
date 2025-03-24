"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Sidebar from "./_components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Check if user is authenticated and has admin role
  if (status === "unauthenticated") {
    router.push("/sign-in");
    return null;
  }

  if (status === "loading") {
    return null;
  }

  // if (session?.user?.role !== "admin") {
  //   router.push("/");
  //   return null;
  // }

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
