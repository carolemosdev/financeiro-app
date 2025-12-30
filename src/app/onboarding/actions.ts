"use server"

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function setupInitialData(formData: FormData) {
  // 1. Tenta achar um usuário existente
  let user = await prisma.user.findFirst();

  // 2. SE NÃO ACHAR, CRIA UM NOVO (Agora com email e senha padrão)
  if (!user) {
    console.log("Criando usuário padrão...");
    user = await prisma.user.create({
      data: {
        name: "Carol Dev",
        email: "carol@email.com",   // Novo campo obrigatório
        password: "123",            // Senha temporária (vamos melhorar na Fase 3)
      }
    });
  }

  const bankName = formData.get("bankName") as string;
  const initialBalance = parseFloat(formData.get("initialBalance") as string);
  
  // Investimento (Opcional)
  const ticker = formData.get("ticker") as string;
  const quantity = formData.get("quantity") ? parseFloat(formData.get("quantity") as string) : 0;
  const price = formData.get("price") ? parseFloat(formData.get("price") as string) : 0;

  await prisma.$transaction(async (tx) => {
    // Cria a Conta
    const account = await tx.account.create({
      data: {
        name: bankName,
        balance: initialBalance,
        type: "CHECKING",
        userId: user.id
      }
    });

    // Cria o Histórico Inicial
    await tx.transaction.create({
      data: {
        description: "Saldo Inicial",
        amount: initialBalance,
        type: "INCOME",
        category: "Ajuste",
        date: new Date(),
        accountId: account.id // Transação vinculada à conta
      }
    });

    // Cria Investimento (se houver)
    if (ticker && quantity > 0) {
      const asset = await tx.asset.create({
        data: {
          ticker: ticker.toUpperCase(),
          type: "STOCK",
          userId: user.id
        }
      });

      await tx.order.create({
        data: {
          assetId: asset.id,
          type: "BUY",
          quantity: quantity,
          price: price,
          date: new Date()
        }
      });
    }
  });

  redirect("/dashboard");
}