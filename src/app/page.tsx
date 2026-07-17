import { redirect } from "next/navigation";
import { currentYearMonth } from "@/lib/finance/constants";

export default function HomePage() {
  redirect(`/months/${currentYearMonth()}`);
}
