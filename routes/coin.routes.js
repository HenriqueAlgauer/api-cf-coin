import { prisma } from "../prisma/client.js";

export default async function coinRoutes(app) {
  // Criar uma moeda para um usuário
  app.post("/coins", async (request, reply) => {
    const { userId, amount } = request.body;

    const userExists = await prisma.user.findUnique({
      where: { id: Number(userId) },
    });

    if (!userExists) {
      return reply.status(404).send({ error: "Usuário não encontrado" });
    }

    const coin = await prisma.coin.create({
      data: {
        userId: Number(userId),
        amount,
        status: "PENDING", // Define o status inicial
      },
    });

    reply.status(201).send(coin);
  });

  app.get("/coins", async (request, reply) => {
    const coins = await prisma.coin.findMany();
    reply.send(coins);
  });

  app.get("/coins/pending", async (request, reply) => {
    const pendingCoins = await prisma.coin.findMany({
      where: { status: "PENDING" },
      include: { user: true }, // Inclui os detalhes do usuário que solicitou a moeda
    });

    reply.send(pendingCoins);
  });

  // Aprovar uma moeda (definir qual admin aprovou)
  app.patch("/coins/:id/approve", async (request, reply) => {
    const { id } = request.params;
    const { adminId } = request.body;

    const coin = await prisma.coin.findUnique({ where: { id: Number(id) } });

    if (!coin) {
      return reply.status(404).send({ error: "Moeda não encontrada" });
    }

    if (coin.status !== "PENDING") {
      return reply.status(400).send({ error: "Moeda já foi processada" });
    }

    const updatedCoin = await prisma.coin.update({
      where: { id: Number(id) },
      data: {
        status: "APPROVED",
        approvedBy: adminId,
      },
    });

    await prisma.user.update({
      where: { id: coin.userId },
      data: { coins: { increment: coin.amount } },
    });

    reply.send(updatedCoin);
  });

  app.patch("/coins/:id/reject", async (request, reply) => {
    const { id } = request.params;
    const { adminId } = request.body;

    const coin = await prisma.coin.findUnique({ where: { id: Number(id) } });

    if (!coin) {
      return reply.status(404).send({ error: "Moeda não encontrada" });
    }

    if (coin.status !== "PENDING") {
      return reply.status(400).send({ error: "Moeda já foi processada" });
    }

    const updatedCoin = await prisma.coin.update({
      where: { id: Number(id) },
      data: {
        status: "REJECTED",
        approvedBy: adminId,
      },
    });

    reply.send(updatedCoin);
  });
}
