import { NextRequest, NextResponse } from "next/server";

interface BathroomStatusRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: BathroomStatusRouteProps,
) {
  const { id } = await params;

  return NextResponse.json({
    bathroomId: id,
    isOpen: true,
    message: "Status endpoint scaffold.",
  });
}
