import { prisma } from "../prisma/client.js";

export async function redeemPrize(userId, prizeId) {
  const user = await prisma.user.findUnique({ where: { id: Number(userId) } });
  const prize = await prisma.prize.findUnique({
    where: { id: Number(prizeId) },
  });

  if (!user) {
    throw new Error("Usuário não encontrado.");
  }

  if (!prize) {
    throw new Error("Prêmio não encontrado.");
  }

  if (user.coins < prize.cost) {
    throw new Error("Moedas insuficientes para resgatar este prêmio.");
  }

  // Subtrai as moedas do usuário e cria um resgate de prêmio
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { coins: user.coins - prize.cost },
  });

  const redemption = await prisma.prizeRedemption.create({
    data: { userId, prizeId, status: "PENDING" },
  });

  return redemption;
}
