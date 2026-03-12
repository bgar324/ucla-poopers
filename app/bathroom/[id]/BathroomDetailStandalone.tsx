"use client";

import { useRouter } from "next/navigation";
import BathroomDetailPanel from "@/app/components/BathroomDetailPanel";

interface BathroomDetailStandaloneProps {
  bathroomId: string;
}

export default function BathroomDetailStandalone({
  bathroomId,
}: BathroomDetailStandaloneProps) {
  const router = useRouter();

  return (
    <BathroomDetailPanel
      bathroomId={bathroomId}
      backLabel="Back"
      onBack={() => {
        if (window.history.length > 1) {
          router.back();
          return;
        }

        router.push("/dashboard");
      }}
    />
  );
}
