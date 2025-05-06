// src/app/dashboard/layout.tsx
"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/app/services/firebase/config";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
      } else {
        setAuthChecked(true);
      }
    });
    return unsubscribe;
  }, [router]);

  if (!authChecked) {
    return null;
  }

  return <>{children}</>;
}
