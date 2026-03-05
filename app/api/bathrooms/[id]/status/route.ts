import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

<<<<<<< HEAD
interface BathroomStatusRouteProps {
  params: Promise<{ id: string }>;
}

export async function GET(
  _request: NextRequest,
  { params }: BathroomStatusRouteProps,
) {
  try {
    const { id } = await params;
=======
//add bathroom
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
>>>>>>> 9e45d18 (updated the add bathroom function)

    const {
      name,
      building,
      floor,
      latitude,
      longitude,
      type,
      supabaseAuthId,
    } = body;

    if (!name || !building || floor === undefined || !latitude || !longitude || !type || !supabaseAuthId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { supabaseAuthId },
    });
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const bathroom = await prisma.bathroom.create({
      data: {
        name,
        building,
        floor: Number(floor),
        latitude: Number(latitude),
        longitude: Number(longitude),
        type,
        created_by: user.id,
      },
    });

    return NextResponse.json(bathroom, { status: 201 });

  } catch (error) {
    console.error("CREATE BATHROOM ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create bathroom" },
      { status: 500 }
    );
  }
}


//retrieve data
interface BathroomStatusRouteProps {
  params: { id: string };
}
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const type = searchParams.get("type");
    const building = searchParams.get("building");
    const floor = searchParams.get("floor");

    const bathrooms = await prisma.bathroom.findMany({
      where: {
        ...(type && { type }),
        ...(building && { building }),
        ...(floor && { floor: Number(floor) }),
      },
      include: {
        reviews: true,
      },
    });

    return NextResponse.json(bathrooms);

  } catch (error) {
    console.error("GET BATHROOMS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch bathrooms" },
      { status: 500 }
    );
  }
}

//bathroom toggle
export async function PATCH(
  request: NextRequest,
  { params }: BathroomStatusRouteProps,
) {
  try {
    const { id } = await params;
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
