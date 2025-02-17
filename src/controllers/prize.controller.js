import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

import {
  createPrizeService,
  updatePrizeService,
  deletePrizeService,
  requestPrizeRedemptionService,
  approvePrizeRedemptionService,
  rejectPrizeRedemptionService,
} from "../services/prize.service.js";

/**
 * Cria um novo prêmio.
 */
export async function createPrize(req, reply) {
  try {
    let { name, description, cost } = req.body;
    if (!name || cost === undefined || typeof cost !== "number") {
      return reply
        .status(400)
        .send({ error: "Todos os campos são obrigatórios." });
    }
    if (!description) {
      description = "";
    }
    const prize = await createPrizeService({ name, description, cost });
    reply.status(201).send(prize);
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      // Nome do Prêmio é único
      reply
        .status(400)
        .send({ error: "Já existe um prêmio com este nome. Tente outro." });
    } else {
      console.error("Erro ao criar prêmio:", error);
      reply.status(500).send({ error: "Erro ao criar prêmio." });
    }
  }
}

/**
 * Lista todos os prêmios.
 */
export async function getPrizes(req, reply) {
  try {
    const prizes = await prisma.prize.findMany();
    reply.send(prizes);
  } catch (error) {
    console.error("Erro ao buscar prêmios:", error);
    reply.status(500).send({ error: "Erro ao buscar prêmios." });
  }
}

/**
 * Atualiza um prêmio.
 */
export async function updatePrize(req, reply) {
  try {
    const { id } = req.params;
    let { name, description, cost } = req.body;

    if (!name || cost === undefined || typeof cost !== "number") {
      return reply
        .status(400)
        .send({ error: "Todos os campos são obrigatórios." });
    }

    if (!description) {
      description = "";
    }
    const prize = await updatePrizeService({
      id: Number(id),
      name,
      description,
      cost,
    });
    reply.send(prize);
  } catch (error) {
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      // Nome do Prêmio duplicado
      reply
        .status(400)
        .send({ error: "Já existe um prêmio com este nome. Tente outro." });
    } else if (error.code === "P2025") {
      // Record not found
      reply
        .status(404)
        .send({ error: "Prêmio não encontrado para atualizar." });
    } else {
      console.error("Erro ao atualizar prêmio:", error);
      reply.status(500).send({ error: "Erro ao atualizar prêmio." });
    }
  }
}

/**
 * Deleta um prêmio.
 */
export async function deletePrize(req, reply) {
  try {
    const { id } = req.params;
    await deletePrizeService(Number(id));
    reply.send({ message: "Prêmio deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar prêmio:", error);
    if (error.code === "P2025") {
      return reply
        .status(404)
        .send({ error: "Prêmio não encontrado para exclusão." });
    }
    reply.status(500).send({ error: "Erro ao deletar prêmio." });
  }
}

/**
 * Solicita o resgate de um prêmio.
 */
export async function requestPrizeRedemption(req, reply) {
  try {
    const { userId, prizeId } = req.body;
    if (!userId || !prizeId) {
      return reply
        .status(400)
        .send({ error: "Usuário e Prêmio são obrigatórios." });
    }
    const redemption = await requestPrizeRedemptionService({ userId, prizeId });
    reply.status(201).send(redemption);
  } catch (error) {
    console.error("Erro ao solicitar resgate:", error);
    if (error.code === "P2025") {
      // Se o usuário ou prêmio não existe
      reply.status(404).send({ error: "Usuário ou Prêmio não encontrado." });
    } else {
      reply.status(500).send({ error: error.message });
    }
  }
}

/**
 * Lista os resgates pendentes.
 */
export async function getPendingPrizeRedemptions(req, reply) {
  try {
    const pendingRedemptions = await prisma.prizeRedemption.findMany({
      where: { status: "PENDING" },
      include: {
        user: { select: { name: true } },
        prize: { select: { name: true, cost: true } },
      },
    });
    reply.send(pendingRedemptions);
  } catch (error) {
    console.error("Erro ao buscar resgates pendentes:", error);
    reply.status(500).send({ error: "Erro ao buscar resgates pendentes." });
  }
}

/**
 * Aprova um resgate de prêmio.
 */
export async function approvePrizeRedemption(req, reply) {
  try {
    const { id } = req.params;
    const updatedRedemption = await approvePrizeRedemptionService(Number(id));
    reply.send(updatedRedemption);
  } catch (error) {
    console.error("Erro ao aprovar o resgate:", error);
    if (error.code === "P2025") {
      reply.status(404).send({ error: "Resgate não encontrado." });
    } else {
      reply.status(500).send({ error: "Erro ao aprovar o resgate." });
    }
  }
}

/**
 * Rejeita um resgate de prêmio.
 */
export async function rejectPrizeRedemption(req, reply) {
  try {
    const { id } = req.params;
    const updatedRedemption = await rejectPrizeRedemptionService(Number(id));
    reply.send(updatedRedemption);
  } catch (error) {
    console.error("Erro ao rejeitar o resgate:", error);
    if (error.code === "P2025") {
      reply.status(404).send({ error: "Resgate não encontrado." });
    } else {
      reply.status(500).send({ error: "Erro ao rejeitar o resgate." });
    }
  }
}

/**
 * Lista os resgates de um usuário específico.
 */
export async function getUserPrizeRedemptions(req, reply) {
  try {
    const { userId } = req.params;
    const userRedemptions = await prisma.prizeRedemption.findMany({
      where: { userId: Number(userId) },
      include: { prize: { select: { name: true, cost: true } } },
    });
    reply.send(userRedemptions);
  } catch (error) {
    console.error("Erro ao buscar resgates do usuário:", error);
    reply.status(500).send({ error: "Erro ao buscar resgates." });
  }
}
