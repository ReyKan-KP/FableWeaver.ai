import { Metadata } from "next"
import EditThread from "../../_components/edit-thread"
import Loading from "./loading";

export const metadata: Metadata = {
  title: "Edit Thread | Thread Tapestry",
  description: "Edit your thread on Thread Tapestry",
}

export default function EditThreadPage({ params }: { params: { threadId: string } }) {
  const isLoading = status === "loading";
  return (
    isLoading ? (
      <Loading />
    ) : (
      <div className="container max-w-4xl py-8">
        <h1 className="text-2xl font-bold mb-6">Edit Thread</h1>
      <EditThread threadId={params.threadId} />
      </div>
    )
  )
} 