"use client"
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
    const { data: session, status } = useSession();
    const router = useRouter();
    if (status === "unauthenticated") {
        router.push("/sign-in");
    }
  return <>{children}</>;
}
