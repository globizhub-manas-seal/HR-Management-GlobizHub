"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/register/wizard");
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="text-center">
        <p className="text-slate-500 font-medium animate-pulse">Redirecting to setup wizard...</p>
      </div>
    </div>
  );
}
