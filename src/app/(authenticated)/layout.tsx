import { RootLayout } from "@/components/layout/root-layout";
import { checkLoggedIn } from "@/lib/utils/auth";
import { redirect } from "next/navigation";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isLoggedIn = await checkLoggedIn();

  if (!isLoggedIn) {
    redirect("/auth/sign-in");
  }

  return <RootLayout>{children}</RootLayout>;
}
