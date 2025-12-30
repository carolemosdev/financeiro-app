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

  if (!transaction || !transaction.account) {
    throw new Error("Transação não encontrada");
  }

  // CONVERSÃO SEGURA: Number() para evitar erro de tipo Decimal
  const currentBalance = Number(transaction.account.balance);
  const transactionAmount = Number(transaction.amount);

  // Se era DESPESA, devolve o dinheiro. Se era RECEITA, remove o valor
  const newBalance =
    transaction.type === "EXPENSE"
      ? currentBalance + transactionAmount
      : currentBalance - transactionAmount;

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // 1. Atualiza o saldo da conta
    await tx.account.update({
      where: { id: transaction.accountId },
      data: { balance: newBalance },
    });

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

  // 1. Busca a transação antiga
  const oldTransaction = await prisma.transaction.findUnique({
    where: { id },
    include: { account: true }
  });

  if (!oldTransaction || !oldTransaction.account) {
    throw new Error("Transação não encontrada");
  }

  // --- CORREÇÃO PRINCIPAL: Converter Decimal para Number ---
  const oldAmount = Number(oldTransaction.amount);
  const currentAccountBalance = Number(oldTransaction.account.balance);

  // 2. Calcula o saldo "revertido" (como se a transação antiga nunca tivesse existido)
  let balanceAfterRevert = currentAccountBalance;
  
  if (oldTransaction.type === "EXPENSE") {
    balanceAfterRevert += oldAmount; // Devolve o dinheiro gasto
  } else {
    balanceAfterRevert -= oldAmount; // Remove o dinheiro ganho
  }

  // 3. Aplica o novo valor sobre o saldo revertido
  let finalBalance = balanceAfterRevert;
  
  if (type === "EXPENSE") {
    finalBalance -= amount;
  } else {
    finalBalance += amount;
  }

  // 4. Salva tudo no banco
  await prisma.$transaction(async (tx) => {
    // Atualiza a transação
    await tx.transaction.update({
      where: { id },
      data: { description, amount, type, category }
    });

    // Atualiza o saldo da conta com o valor numérico corrigido
    await tx.account.update({
      where: { id: oldTransaction.accountId },
      data: { balance: finalBalance }
    });
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createCreditCard(formData: FormData) {
  const name = formData.get("name") as string;
  const limit = parseFloat(formData.get("limit") as string);
  const closingDay = parseInt(formData.get("closingDay") as string);
  const dueDay = parseInt(formData.get("dueDay") as string);

  // Busca o usuário (por enquanto pegamos o primeiro, na Fase 3 pegaremos o logado)
  const user = await prisma.user.findFirst();

  if (!user) throw new Error("Usuário não encontrado");

  await prisma.creditCard.create({
    data: {
      name,
      limit,
      closingDay,
      dueDay,
      userId: user.id
    }
  });

  revalidatePath("/dashboard/cards"); // Atualiza a página de cartões
  revalidatePath("/dashboard");       // Atualiza o painel principal
}

export async function createGoal(formData: FormData) {
  const name = formData.get("name") as string;
  const targetAmount = parseFloat(formData.get("targetAmount") as string);
  const currentAmount = parseFloat(formData.get("currentAmount") as string) || 0;
  const deadlineString = formData.get("deadline") as string;
  
  // Converte a data do formulário para o formato do banco
  const deadline = deadlineString ? new Date(deadlineString) : null;

  const user = await prisma.user.findFirst();
  if (!user) throw new Error("Usuário não encontrado");

  await prisma.goal.create({
    data: {
      name,
      targetAmount,
      currentAmount,
      deadline,
      userId: user.id
    }
  });

  revalidatePath("/dashboard/goals");
}

// Função extra para ADICIONAR dinheiro a uma meta (Depósito)
export async function addMoneyToGoal(formData: FormData) {
  const goalId = formData.get("goalId") as string;
  const amountToAdd = parseFloat(formData.get("amount") as string);

  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal) return;

  // Atualiza o valor guardado
  await prisma.goal.update({
    where: { id: goalId },
    data: { currentAmount: Number(goal.currentAmount) + amountToAdd }
  });

  // Opcional: Aqui poderíamos criar uma TRANSACAO de despesa na conta também ("Saída para Investimento")
  // Mas por enquanto vamos manter simples.

  revalidatePath("/dashboard/goals");
}