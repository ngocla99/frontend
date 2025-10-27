"use client";

import { RootLayout } from "@/components/layout/root-layout";
import { useUser } from "@/stores/auth-store";
import { redirect, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      redirect("/auth/sign-in");
    }
  }, [user, router]);

  if (!user) {
    return null; // or loading spinner
  }

  return <RootLayout>{children}</RootLayout>;
}
