import { prisma } from "../prisma/client.js";

export default async function coinRoutes(app) {
  // Criar uma moeda para um usuário
  app.post("/coins", async (request, reply) => {
    try {
      const { userId, taskId } = request.body;

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

      const userExists = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      const taskExists = await prisma.task.findUnique({
        where: { id: taskId },
      });

      if (!taskExists) {
        return reply.status(404).send({ error: "Tarefa não encontrada" });
      }

      const coin = await prisma.coin.create({
        data: {
          user: { connect: { id: userId } },
          task: { connect: { id: taskId } },
          amount: taskExists.reward,
          status: "PENDING",
        },
      });

      reply.status(201).send(coin);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro interno ao criar coin" });
    }
  });

  app.get("/coins", async (request, reply) => {
    const coins = await prisma.coin.findMany();
    reply.send(coins);
  });

  app.get("/coins/pending", async (request, reply) => {
    const pendingCoins = await prisma.coin.findMany({
      where: { status: "PENDING" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            department: true, // ✅ Agora retorna apenas os campos relevantes
          },
        },
        task: {
          select: {
            name: true, // ✅ Também inclui o nome da Tarefa associada
          },
        },
      },
    });

    reply.send(pendingCoins);
  });

  app.get("/coins/user/:userId", async (request, reply) => {
    const { userId } = request.params;

    const userCoins = await prisma.coin.findMany({
      where: { userId: Number(userId) },
      include: {
        task: { select: { name: true } }, // ✅ Retorna o nome da Task
      },
    });

    reply.send(userCoins);
  });

  app.patch("/coins/:id/approve", async (request, reply) => {
    const { id } = request.params;
    const { adminId } = request.body;

    // Verifica se o adminId pertence a um usuário com role 'ADMIN'
    const admin = await prisma.user.findUnique({ where: { id: adminId } });

    if (!admin || admin.role !== "ADMIN") {
      return reply
        .status(403)
        .send({ error: "Acesso negado: Apenas ADMINs podem aprovar moedas." });
    }

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
