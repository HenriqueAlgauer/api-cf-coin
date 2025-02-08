import { prisma } from "../prisma/client.js";

/**
 * Aprova uma solicitação de Coin e adiciona o valor ao saldo do usuário.
 */
export async function approveCoinRequest(coinId, adminId) {
  // Valida se o adminId foi fornecido
  if (!adminId) {
    throw new Error("AdminId é obrigatório para aprovar a coin.");
  }

  // Busca o administrador e verifica se ele tem permissão
  const admin = await prisma.user.findUnique({
    where: { id: Number(adminId) },
  });

  if (!admin || admin.role !== "ADMIN") {
    throw new Error("Apenas ADMINs podem aprovar moedas.");
  }

  // Busca a coin no banco de dados
  const coin = await prisma.coin.findUnique({
    where: { id: Number(coinId) },
  });

  if (!coin) {
    throw new Error("Moeda não encontrada.");
  }

  if (coin.status !== "PENDING") {
    throw new Error("Moeda já foi processada.");
  }

  // Aprova a coin e adiciona as moedas ao usuário
  const updatedCoin = await prisma.coin.update({
    where: { id: Number(coinId) },
    data: {
      status: "APPROVED",
      approvedBy: Number(adminId),
      updatedAt: new Date(),
    },
  });

  // Incrementa as moedas do usuário
  await prisma.user.update({
    where: { id: coin.userId },
    data: { coins: { increment: coin.amount } },
  });

  return updatedCoin;
}

/**
 * Processa um resgate de prêmio e subtrai o valor das moedas do usuário.
 */
