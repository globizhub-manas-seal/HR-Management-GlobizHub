"use client";

// src/app/register/wizard/page.tsx
// Backward-compatibility redirect: Forward /register/wizard cleanly to /register

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function WizardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/register");
  }, [router]);

  return null;
}
