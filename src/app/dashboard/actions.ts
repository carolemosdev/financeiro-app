"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createTransaction(formData: FormData) {
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const category = formData.get("category") as string;

  const account = await prisma.account.findFirst({ orderBy: { id: 'desc' } });

  if (!account) throw new Error("Conta não encontrada");

  // CONVERSÃO SEGURA: Number() garante que não é um objeto Decimal
  const currentBalance = Number(account.balance);

  const newBalance = type === "EXPENSE" 
    ? currentBalance - amount 
    : currentBalance + amount;

  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        description,
        amount,
        type,
        category,
        date: new Date(),
        accountId: account.id,
      }
    });

    await tx.account.update({
      where: { id: account.id },
      data: { balance: newBalance }
    });
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function deleteTransaction(formData: FormData) {
  const transactionId = formData.get("id") as string;

  if (!transactionId) {
    throw new Error("ID da transação não informado");
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: { account: true },
  });

  if (!transaction) {
    throw new Error("Transação não encontrada");
  }

  // Lógica de saldo (Só aplicável se tiver conta vinculada)
  let newBalance = 0;
  if (transaction.account) {
    const currentBalance = Number(transaction.account.balance);
    const transactionAmount = Number(transaction.amount);

    newBalance =
      transaction.type === "EXPENSE"
        ? currentBalance + transactionAmount
        : currentBalance - transactionAmount;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Atualiza o saldo da conta (SÓ SE TIVER CONTA VINCULADA)
    // A CORREÇÃO ESTÁ NESTE IF ABAIXO:
    if (transaction.accountId) { 
      await tx.account.update({
        where: { id: transaction.accountId },
        data: { balance: newBalance },
      });
    }

    // 2. Remove a transação
    await tx.transaction.delete({
      where: { id: transactionId },
    });
  });

  revalidatePath("/dashboard");
}

export async function updateTransaction(formData: FormData) {
  const id = formData.get("id") as string;
  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const category = formData.get("category") as string;

  const oldTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: { account: true }
  });

  if (!oldTransaction) {
    throw new Error("Transação não encontrada");
  }

  await prisma.$transaction(async (tx) => {
    // Atualiza a transação
    await tx.transaction.update({
      where: { id },
      data: { description, amount, type, category }
    });

    // SÓ ATUALIZA SALDO SE FOR UMA CONTA BANCÁRIA (NÃO CARTÃO)
    if (oldTransaction.accountId && oldTransaction.account) {
        const oldAmount = Number(oldTransaction.amount);
        const currentAccountBalance = Number(oldTransaction.account.balance);

        // Reverte
        let balanceAfterRevert = currentAccountBalance;
        if (oldTransaction.type === "EXPENSE") {
            balanceAfterRevert += oldAmount;
        } else {
            balanceAfterRevert -= oldAmount;
        }

        // Aplica novo
        let finalBalance = balanceAfterRevert;
        if (type === "EXPENSE") {
            finalBalance -= amount;
        } else {
            finalBalance += amount;
        }

        await tx.account.update({
            where: { id: oldTransaction.accountId },
            data: { balance: finalBalance }
        });
    }
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}