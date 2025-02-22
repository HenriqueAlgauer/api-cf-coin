import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import {
  createCoinService,
  approveCoinRequest,
  updateCoinMessageService,
  rejectCoinService,
  deleteCoinService,
  addCoinsForTaskService,
} from "../services/coin.service.js";

/**
 * Cria uma nova solicitação de coin.
 */
export async function createCoin(req, reply) {
  try {
    const { userId, taskId, message } = req.body;

    if (!userId || typeof userId !== "number") {
      return reply.status(400).send({
        error: "O campo 'userId' é obrigatório e deve ser um número.",
      });
    }
    if (!taskId || typeof taskId !== "number") {
      return reply.status(400).send({
        error: "O campo 'taskId' é obrigatório e deve ser um número.",
      });
    }

    const coin = await createCoinService({ userId, taskId, message });
    reply.status(201).send(coin);
  } catch (error) {
    console.error(error);
    if (error.code === "P2002") {
      // Se houver alguma constraint unique em Coin que foi violada, pode tratar
      reply
        .status(400)
        .send({ error: "Já existe um registro Coin duplicado." });
    } else {
      reply.status(500).send({ error: "Erro interno ao criar coin" });
    }
  }
}

/**
 * Adiciona coins para vários usuários, com base em uma tarefa, aprovando-as automaticamente.
 */
export async function addCoinsForTaskController(req, reply) {
  try {
    const { taskId, userIds, adminId } = req.body;
    if (
      !taskId ||
      !userIds ||
      !Array.isArray(userIds) ||
      userIds.length === 0
    ) {
      return reply.status(400).send({
        error:
          "taskId e userIds são obrigatórios e userIds deve ser um array não vazio.",
      });
    }
    const coins = await addCoinsForTaskService({ taskId, userIds, adminId });
    reply.status(201).send({
      message: "CF Coins cadastradas com sucesso.",
      coins,
    });
  } catch (error) {
    console.error("Erro ao cadastrar CF Coins:", error);
    if (error.code === "P2025") {
      reply.status(404).send({
        error: "Tarefa ou algum usuário não encontrado para cadastrar coins.",
      });
    } else {
      reply.status(500).send({
        error: error.message || "Erro ao cadastrar CF Coins.",
      });
    }
  }
}

/**
 * Lista todas as coins.
 */
export async function getCoins(req, reply) {
  try {
    const coins = await prisma.coin.findMany();
    reply.send(coins);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: "Erro ao buscar coins" });
  }
}

/**
 * Lista as coins com status PENDING.
 */
export async function getPendingCoins(req, reply) {
  try {
    const pendingCoins = await prisma.coin.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { id: true, name: true, department: true } },
        task: { select: { id: true, name: true } },
      },
    });
    reply.send(pendingCoins);
  } catch (error) {
    console.error(error);
    reply.status(500).send({ error: "Erro ao buscar solicitações pendentes." });
  }
}

/**
 * Lista as coins de um usuário específico.
 */
export async function getUserCoins(req, reply) {
  try {
    const { userId } = req.params;
    if (!userId || isNaN(userId)) {
      return reply.status(400).send({ error: "ID do usuário inválido." });
    }
    const userCoins = await prisma.coin.findMany({
      where: { userId: Number(userId) },
      include: { task: { select: { name: true } } },
    });
    reply.send(userCoins);
  } catch (error) {
    console.error("Erro ao buscar moedas do usuário:", error);
    reply.status(500).send({ error: "Erro ao buscar as moedas." });
  }
}

/**
 * Lista apenas as coins pendentes de um usuário específico.
 */
export async function getUserPendingCoins(req, reply) {
  try {
    const { userId } = req.params;
    if (!userId || isNaN(userId)) {
      return reply.status(400).send({ error: "ID do usuário inválido." });
    }
    const userCoins = await prisma.coin.findMany({
      where: { userId: Number(userId), status: "PENDING" },
      include: { task: { select: { name: true } } },
    });
    reply.send(userCoins);
  } catch (error) {
    console.error("Erro ao buscar moedas pendentes do usuário.", error);
    reply
      .status(500)
      .send({ error: "Erro ao buscar moedas pendentes do usuário." });
  }
}

/**
 * Aprova uma solicitação de coin.
 */
export async function approveCoin(req, reply) {
  try {
    const { id } = req.params;
    const { adminId } = req.body;
    const updatedCoin = await approveCoinRequest(id, adminId);
    reply.send(updatedCoin);
  } catch (error) {
    console.error("Erro ao aprovar a coin:", error);
    reply.status(400).send({ error: error.message });
  }
}

/**
 * Atualiza a mensagem de uma solicitação.
 */
export async function updateCoinMessage(req, reply) {
  try {
    const { id } = req.params;
    const { message } = req.body;
    if (!id) {
      return reply
        .status(400)
        .send({ error: "ID da solicitação é obrigatório." });
    }
    const updatedCoin = await updateCoinMessageService({
      coinId: Number(id),
      message,
    });
    reply.send(updatedCoin);
  } catch (error) {
    console.error("Erro ao atualizar a solicitação:", error);
    reply.status(500).send({ error: "Erro ao atualizar a solicitação." });
  }
}

/**
 * Rejeita uma solicitação de coin.
 */
export async function rejectCoin(req, reply) {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    if (!adminId) {
      return reply
        .status(400)
        .send({ error: "AdminId é obrigatório para rejeitar a coin." });
    }

    const updatedCoin = await rejectCoinService(id, adminId);
    reply.send(updatedCoin);
  } catch (error) {
    console.error("Erro ao rejeitar a coin:", error);
    reply.status(400).send({ error: error.message });
  }
}

/**
 * Exclui uma solicitação de coin.
 */
export async function deleteCoin(req, reply) {
  try {
    const { id } = req.params;
    await deleteCoinService(id);
    reply.send({ message: "Solicitação excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir a solicitação:", error);
    if (error.code === "P2025") {
      return reply.status(404).send({ error: "Solicitação não encontrada." });
    }
    reply.status(500).send({ error: "Erro ao excluir a solicitação." });
  }
}
