"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ActifsRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/stock");
  }, [router]);
  return (
    <div className="flex items-center justify-center min-h-[200px] text-slate-500">
      Redirection vers Stock…
    </div>
  );
}
