"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  const router = useRouter();

  console.log("[AuthGuard] Rendering, token:", token ? "present" : "missing");

  useEffect(() => {
    console.log("[AuthGuard] useEffect, token:", token ? "present" : "missing");
    if (!token) {
      console.log("[AuthGuard] No token, redirecting to /login");
      router.replace("/login");
    }
  }, [token, router]);

  if (!token) {
    console.log("[AuthGuard] Returning null (no token)");
    return null;
  }
  console.log("[AuthGuard] Rendering children");
  return <>{children}</>;
}
