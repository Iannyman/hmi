import { redirect } from "next/navigation";

export default function HomePage() {
  // Use direct redirect - this runs server-side only
  redirect("/dashboard");
}
