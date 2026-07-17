import { redirect } from "next/navigation";
import { currentYearMonth } from "@/lib/finance/constants";

export default function SisterIndexPage() {
  redirect(`/sister/${currentYearMonth()}`);
}
