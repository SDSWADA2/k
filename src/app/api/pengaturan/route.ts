import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const data = await prisma.pengaturan.findMany();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal memuat pengaturan" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body: Record<string, string> = await req.json();
    await Promise.all(
      Object.entries(body).map(([kunci, nilai]) =>
        prisma.pengaturan.upsert({
          where: { kunci },
          create: { kunci, nilai },
          update: { nilai },
        })
      )
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
