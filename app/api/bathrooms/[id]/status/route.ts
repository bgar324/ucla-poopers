import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface BathroomStatusRouteProps {
  params: { id: string };
}

export async function GET(
  _request: NextRequest,
  { params }: BathroomStatusRouteProps,
) {
  try {
    const { id } = params;

    const bathroom = await prisma.bathroom.findUnique({
      where: { id },
      select: { is_closed: true },
    });

    if (!bathroom) {
      return NextResponse.json(
        { error: "Bathroom not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bathroomId: id,
      isOpen: !bathroom.is_closed,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch bathroom status" },
      { status: 500 }
    );
  }
}
export async function PATCH(
  request: NextRequest,
  { params }: BathroomStatusRouteProps,
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