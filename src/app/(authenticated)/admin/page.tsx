import { redirect } from "next/navigation";

export default function AdminPage() {
	// Redirect to the first category (matching algorithm)
	redirect("/admin/matching-algorithm");
}
