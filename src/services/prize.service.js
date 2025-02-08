// src/services/prize.service.js
import { prisma } from "../prisma/client.js";

/**
 * Cria um novo prêmio.
 */
export async function createPrizeService({ name, description, cost }) {
  const prize = await prisma.prize.create({
    data: { name, description, cost },
  });
  return prize;
}

/**
 * Atualiza um prêmio.
 */
export async function updatePrizeService({ id, name, description, cost }) {
  const prize = await prisma.prize.update({
    where: { id },
    data: { name, description, cost },
  });
  return prize;
}

/**
 * Deleta um prêmio.
 */
export async function deletePrizeService(id) {
  await prisma.prize.delete({ where: { id } });
}

/**
 * Processa a solicitação de resgate de prêmio.
 * Subtrai os coins do usuário e cria a solicitação.
 */
export async function requestPrizeRedemptionService({ userId, prizeId }) {
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  const prize = await prisma.prize.findUnique({
    where: { id: Number(prizeId) },
  });
  if (!user) throw new Error("Usuário não encontrado.");
  if (!prize) throw new Error("Prêmio não encontrado.");
  if (user.coins < prize.cost)
    throw new Error("Moedas insuficientes para resgatar este prêmio.");

  // Subtrai as moedas do usuário imediatamente
  await prisma.user.update({
    where: { id: userId },
    data: { coins: { decrement: prize.cost } },
  });

  const redemption = await prisma.prizeRedemption.create({
    data: { userId, prizeId, status: "PENDING" },
  });
  return redemption;
}

/**
 * Aprova o resgate de um prêmio.
 * Como as moedas já foram debitadas na solicitação, apenas atualiza o status.
 */
export async function approvePrizeRedemptionService(id) {
  const redemption = await prisma.prizeRedemption.findUnique({
    where: { id },
    include: { prize: true },
  });
  if (!redemption) throw new Error("Resgate não encontrado.");

  const updatedRedemption = await prisma.prizeRedemption.update({
    where: { id },
    data: { status: "APPROVED" },
  });
  return updatedRedemption;
}

/**
 * Rejeita o resgate de um prêmio.
 * Restaura os coins ao usuário e atualiza o status.
 */
export async function rejectPrizeRedemptionService(id) {
  const redemption = await prisma.prizeRedemption.findUnique({
    where: { id },
    include: { prize: true, user: true },
  });
  if (!redemption) throw new Error("Resgate não encontrado.");
  if (redemption.status !== "PENDING")
    throw new Error("A solicitação já foi processada.");

  // Devolve as moedas ao usuário
  await prisma.user.update({
    where: { id: redemption.userId },
    data: { coins: { increment: redemption.prize.cost } },
  });

  const updatedRedemption = await prisma.prizeRedemption.update({
    where: { id },
    data: { status: "REJECTED" },
  });
  return updatedRedemption;
}
