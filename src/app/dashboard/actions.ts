"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifySession } from "@/lib/auth"; // Importante para segurança
import { Prisma } from "@prisma/client";

// --- TRANSAÇÕES ---

export async function createTransaction(formData: FormData) {
  const user = await verifySession(); // Pega o usuário logado
  if (!user) throw new Error("Usuário não logado");

  const description = formData.get("description") as string;
  const amount = parseFloat(formData.get("amount") as string);
  const type = formData.get("type") as "INCOME" | "EXPENSE";
  const category = formData.get("category") as string;
  const date = new Date(formData.get("date") as string);
  const accountId = formData.get("accountId") as string; // Pode ser vazio se for cartão

  // Lógica simples de transação
  await prisma.$transaction(async (tx) => {
    await tx.transaction.create({
      data: {
        description,
        amount,
        type,
        category,
        date,
        accountId: accountId || null, // Garante nulo se vazio
      }
    });

    // Se tiver conta vinculada, atualiza saldo
    if (accountId) {
      const currentAccount = await tx.account.findUnique({ where: { id: accountId } });
      if (currentAccount) {
        let newBalance = Number(currentAccount.balance);
        if (type === "INCOME") newBalance += amount;
        else newBalance -= amount;

        await tx.account.update({
          where: { id: accountId },
          data: { balance: newBalance }
        });
      }
    }
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
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

        // Reverte saldo antigo
        let balanceAfterRevert = currentAccountBalance;
        if (oldTransaction.type === "EXPENSE") {
            balanceAfterRevert += oldAmount;
        } else {
            balanceAfterRevert -= oldAmount;
        }

        // Aplica novo saldo
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

  let newBalance = 0;
  // Calcula saldo apenas se tiver conta
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

// --- FUNÇÕES DE CARTÕES (Restauradas) ---

export async function createCreditCard(formData: FormData) {
  const userId = await verifySession(); // Segurança: pega o ID do cookie
  if (!userId) throw new Error("Usuário não logado");

  const name = formData.get("name") as string;
  const limit = parseFloat(formData.get("limit") as string);
  const closingDay = parseInt(formData.get("closingDay") as string);
  const dueDay = parseInt(formData.get("dueDay") as string);

  await prisma.creditCard.create({
    data: {
      name,
      limit,
      closingDay,
      dueDay,
      userId: userId // Usa o ID real
    }
  });

  revalidatePath("/dashboard/cards");
  revalidatePath("/dashboard");
}

// --- FUNÇÕES DE METAS (Restauradas) ---

export async function createGoal(formData: FormData) {
  const userId = await verifySession(); // Segurança
  if (!userId) throw new Error("Usuário não logado");

  const name = formData.get("name") as string;
  const targetAmount = parseFloat(formData.get("targetAmount") as string);
  const currentAmount = parseFloat(formData.get("currentAmount") as string) || 0;
  const deadlineString = formData.get("deadline") as string;
  
  const deadline = deadlineString ? new Date(deadlineString) : null;

  await prisma.goal.create({
    data: {
      name,
      targetAmount,
      currentAmount,
      deadline,
      userId: userId
    }
  });

  revalidatePath("/dashboard/goals");
}

export async function addMoneyToGoal(formData: FormData) {
  const goalId = formData.get("goalId") as string;
  const amountToAdd = parseFloat(formData.get("amount") as string);

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return;

  await prisma.goal.update({
    where: { id: goalId },
    data: { currentAmount: Number(goal.currentAmount) + amountToAdd }
  });

  revalidatePath("/dashboard/goals");
}