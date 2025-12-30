"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Em um app real, retornaríamos um erro visual
    redirect("/login?error=user_not_found");
  }

  // Verifica a senha
  // ATENÇÃO: Se suas senhas no banco não estão criptografadas (são "123"),
  // usamos comparação direta. Se estiverem criptografadas, usamos bcrypt.compare
  const passwordMatch = user.password === password; 
  // Futuramente trocaremos por: await bcrypt.compare(password, user.password);

  if (!passwordMatch) {
    redirect("/login?error=invalid_password");
  }

  // Cria a sessão e manda pro dashboard
  await createSession(user.id);
  redirect("/dashboard");
}