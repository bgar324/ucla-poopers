import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BathroomDetailStandalone from "./BathroomDetailStandalone";

interface BathroomDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BathroomDetailPage({
  params,
}: BathroomDetailPageProps) {
  const { id } = await params;
  const bathroom = await prisma.bathroom.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!bathroom) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <BathroomDetailStandalone bathroomId={id} />
    </main>
  );
}
