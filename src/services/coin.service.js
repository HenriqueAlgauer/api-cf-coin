// src/services/coin.service.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

export async function addCoinsForTaskService({ taskId, userIds, adminId }) {
  // Validação básica
  if (!taskId || !userIds || !Array.isArray(userIds) || userIds.length === 0) {
    throw new Error(
      "taskId e userIds são obrigatórios e userIds deve ser um array não vazio."
    );
  }

  // Busca a tarefa
  const task = await prisma.task.findUnique({
    where: { id: Number(taskId) },
  });
  if (!task) {
    throw new Error("Tarefa não encontrada.");
  }
  // Opcional: verificar se a visibilidade da tarefa é adequada
  if (!["ADMIN", "AMBOS"].includes(task.visibility)) {
    throw new Error("Esta tarefa não permite que o admin cadastre CF Coins.");
  }

  // Executa a operação para cada usuário dentro de uma transação
  const createdCoins = await prisma.$transaction(async (tx) => {
    const coinsCreated = [];
    for (const userId of userIds) {
      // Verifica se o usuário existe
      const user = await tx.user.findUnique({
        where: { id: Number(userId) },
      });
      if (!user) {
        throw new Error(`Usuário com id ${userId} não encontrado.`);
      }
      // Cria o registro de Coin com status "APPROVED" e valor da recompensa da tarefa
      const coin = await tx.coin.create({
        data: {
          user: { connect: { id: Number(userId) } },
          task: { connect: { id: Number(taskId) } },
          amount: task.reward,
          status: "APPROVED",
          approvedBy: adminId ? Number(adminId) : null,
        },
      });
      // Atualiza o saldo do usuário (incrementa o campo 'coins')
      await tx.user.update({
        where: { id: Number(userId) },
        data: { coins: { increment: task.reward } },
      });
      coinsCreated.push(coin);
    }
    return coinsCreated;
  });

  return createdCoins;
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
  // Converte o adminId para número e verifica se é um administrador
  const numericAdminId = Number(adminId);

  if (isNaN(numericAdminId)) {
    throw new Error("ID do admin inválido.");
  }

  const admin = await prisma.user.findUnique({ where: { id: numericAdminId } });
  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Apenas ADMINs podem rejeitar moedas.");
  }

  // Verifica a existência da coin e seu status
  const coin = await prisma.coin.findUnique({ where: { id: Number(coinId) } });
  if (!coin) throw new Error("Moeda não encontrada");
  if (coin.status !== "PENDING") throw new Error("Moeda já foi processada");

  // Atualiza a coin, garantindo que approvedBy seja um número
  const updatedCoin = await prisma.coin.update({
    where: { id: Number(coinId) },
    data: {
      status: "REJECTED",
      approvedBy: numericAdminId, // Agora é um número
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
