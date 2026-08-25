import { getSessionRole } from "@/lib/auth";
import GameReviewClient from "./GameReviewClient";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function FilmReviewPage({ params }: Props) {
  const role = await getSessionRole();
  return <GameReviewClient params={params} readOnly={role !== "edit"} />;
}
