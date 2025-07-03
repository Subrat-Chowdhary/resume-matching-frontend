import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { name, email, password } = await req.json();

  if (!name || !email || !password)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const exist = await prisma.user.findUnique({ where: { email } });
  if (exist)
    return NextResponse.json({ error: "Email already exists" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, password: hashed, role: "user" }
  });

  return NextResponse.json({
    msg: "Registered",
    user: { id: user.id, name: user.name, email: user.email, role: user.role }
  });
}
