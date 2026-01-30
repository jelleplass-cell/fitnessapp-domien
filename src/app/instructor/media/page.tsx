import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { MediaLibraryView } from "./media-library-view";

export default async function MediaPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return <MediaLibraryView />;
}
