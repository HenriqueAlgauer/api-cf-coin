// src/services/coin.service.js
import { prisma } from "../prisma/client.js";

/**
 * Cria uma nova coin.
 */
export async function createCoinService({ userId, taskId, message }) {
  // Verifica se o usuário existe
  const userExists = await prisma.user.findUnique({ where: { id: userId } });
  if (!userExists) throw new Error("Usuário não encontrado");

  // Verifica se a tarefa existe
  const taskExists = await prisma.task.findUnique({ where: { id: taskId } });
  if (!taskExists) throw new Error("Tarefa não encontrada");

  const coin = await prisma.coin.create({
    data: {
      user: { connect: { id: userId } },
      task: { connect: { id: taskId } },
      amount: taskExists.reward,
      status: "PENDING",
      message: message || null,
    },
    include: { task: true },
  });
  return coin;
}

/**
 * Aprova uma solicitação de coin e incrementa o saldo do usuário.
 */
export async function approveCoinRequest(coinId, adminId) {
  if (!adminId) throw new Error("AdminId é obrigatório para aprovar a coin.");

  const admin = await prisma.user.findUnique({
    where: { id: Number(adminId) },
  });
  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Apenas ADMINs podem aprovar moedas.");
  }

  const coin = await prisma.coin.findUnique({ where: { id: Number(coinId) } });
  if (!coin) throw new Error("Moeda não encontrada.");
  if (coin.status !== "PENDING") throw new Error("Moeda já foi processada.");

  const updatedCoin = await prisma.coin.update({
    where: { id: Number(coinId) },
    data: {
      status: "APPROVED",
      approvedBy: Number(adminId),
      updatedAt: new Date(),
    },
  });

  await prisma.user.update({
    where: { id: coin.userId },
    data: { coins: { increment: coin.amount } },
  });

  return updatedCoin;
}

/**
 * Atualiza a mensagem de uma solicitação de coin.
 */
export async function updateCoinMessageService({ coinId, message }) {
  const coinExists = await prisma.coin.findUnique({ where: { id: coinId } });
  if (!coinExists) throw new Error("Solicitação não encontrada.");

  const updatedCoin = await prisma.coin.update({
    where: { id: coinId },
    data: { message: message || "" },
  });
  return updatedCoin;
}

/**
 * Rejeita uma solicitação de coin.
 */
export async function rejectCoinService(coinId, adminId) {
  const admin = await prisma.user.findUnique({
    where: { id: Number(adminId) },
  });
  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Apenas ADMINs podem rejeitar moedas.");
  }

  const coin = await prisma.coin.findUnique({ where: { id: Number(coinId) } });
  if (!coin) throw new Error("Moeda não encontrada");
  if (coin.status !== "PENDING") throw new Error("Moeda já foi processada");

  const updatedCoin = await prisma.coin.update({
    where: { id: Number(coinId) },
    data: {
      status: "REJECTED",
      approvedBy: adminId,
      updatedAt: new Date(),
    },
  });
  return updatedCoin;
}

/**
 * Exclui uma solicitação de coin.
 */
export async function deleteCoinService(coinId) {
  const coinExists = await prisma.coin.findUnique({
    where: { id: Number(coinId) },
  });
  if (!coinExists) throw new Error("Solicitação não encontrada.");
  await prisma.coin.delete({ where: { id: Number(coinId) } });
}
