import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  topic: z.string().min(2).max(80),
  message: z.string().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const row = await prisma.contactMessage.create({
      data: {
        name: body.name.trim(),
        email: body.email.toLowerCase().trim(),
        topic: body.topic.trim(),
        message: body.message.trim(),
      },
    });
    return NextResponse.json({ id: row.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: "Could not send" }, { status: 500 });
  }
}
