import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
//bathroom toggle
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { isOpen } = body;

    const updated = await prisma.bathroom.update({
      where: { id },
      data: {
        is_closed: !isOpen,
      },
    });

    return NextResponse.json(updated);

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update bathroom status" },
      { status: 500 }
    );
  }
}
