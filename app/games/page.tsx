import { getSessionRole } from "@/lib/auth";
import GamesListClient from "./GamesListClient";

export default async function GamesPage() {
  const role = await getSessionRole();
  return <GamesListClient readOnly={role !== "edit"} />;
}
