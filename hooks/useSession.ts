import { useSession as useNextAuthSession } from "next-auth/react"

export function useSession() {
  const { data: session, status } = useNextAuthSession()
  const loading = status === "loading"

  return { session, loading }
}

