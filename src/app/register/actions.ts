"use server";

import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  // 1. Verifica se o email já existe
  const userExists = await prisma.user.findUnique({
    where: { email }
  });

  if (userExists) {
    // Em um app real, mostraríamos erro na tela. Aqui redirecionamos.
    redirect("/register?error=email_exists");
  }

  // 2. Cria o Usuário e a Conta Inicial (Carteira)
  // Usamos transaction para garantir que cria tudo ou nada
  const newUser = await prisma.$transaction(async (tx) => {
    // A) Cria o usuário
    const user = await tx.user.create({
      data: {
        name,
        email,
        password, // Nota: Em produção, usaríamos bcrypt para criptografar
      }
    });

    // B) Cria uma conta bancária padrão para ele não começar "sem nada"
    await tx.account.create({
      data: {
        name: "Minha Carteira",
        balance: 0,
        type: "CHECKING",
        userId: user.id
      }
    });

    return user;
  });

  // 3. Já faz o login automático (Cria a sessão)
  await createSession(newUser.id);

  // 4. Manda pro Dashboard
  redirect("/dashboard");
}