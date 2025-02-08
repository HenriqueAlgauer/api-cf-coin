import { prisma } from "../prisma/client.js";
import { approveCoinRequest } from "../service/coin.service.js";

export default async function coinRoutes(app) {
  // Criar uma moeda para um usuário
  app.post("/coins", async (request, reply) => {
    try {
      const { userId, taskId, message } = request.body;

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
      if (!userExists)
        return reply.status(404).send({ error: "Usuário não encontrado" });

      const taskExists = await prisma.task.findUnique({
        where: { id: taskId },
      });
      if (!taskExists)
        return reply.status(404).send({ error: "Tarefa não encontrada" });

      const coin = await prisma.coin.create({
        data: {
          user: { connect: { id: userId } },
          task: { connect: { id: taskId } },
          amount: taskExists.reward,
          status: "PENDING",
          message: message || null, // Mensagem do usuário ao solicitar
        },
        include: {
          task: true,
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
    try {
      const pendingCoins = await prisma.coin.findMany({
        where: { status: "PENDING" },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              department: true, // ✅ Inclui o departamento do usuário
            },
          },
          task: {
            select: {
              id: true,
              name: true, // ✅ Inclui o nome da tarefa
            },
          },
        },
      });

      reply.send(pendingCoins);
    } catch (error) {
      console.error(error);
      reply
        .status(500)
        .send({ error: "Erro ao buscar solicitações pendentes." });
    }
  });

  app.get("/coins/user/:userId", async (request, reply) => {
    try {
      const { userId } = request.params;

      if (!userId || isNaN(userId)) {
        return reply.status(400).send({ error: "ID do usuário inválido." });
      }

      const userCoins = await prisma.coin.findMany({
        where: { userId: Number(userId) },
        include: {
          task: { select: { name: true } }, // ✅ Retorna o nome da Task
        },
      });

      reply.send(userCoins);
    } catch (error) {
      console.error("Erro ao buscar moedas do usuário:", error);
      reply.status(500).send({ error: "Erro ao buscar as moedas." });
    }
  });

  app.patch("/coins/:id/approve", async (request, reply) => {
    try {
      const { id } = request.params;
      const { adminId } = request.body;

      const updatedCoin = await approveCoinRequest(id, adminId);
      reply.send(updatedCoin);
    } catch (error) {
      console.error("Erro ao aprovar a coin:", error);
      reply.status(400).send({ error: error.message });
    }
  });

  app.patch("/coins/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { message } = request.body;

      if (!id) {
        return reply
          .status(400)
          .send({ error: "ID da solicitação é obrigatório." });
      }

      // Verifica se a Coin existe
      const coinExists = await prisma.coin.findUnique({
        where: { id: Number(id) },
      });

      if (!coinExists) {
        return reply.status(404).send({ error: "Solicitação não encontrada." });
      }

      // Atualiza apenas a mensagem da solicitação
      const updatedCoin = await prisma.coin.update({
        where: { id: Number(id) },
        data: { message: message || "" }, // ✅ Garante que o campo nunca será `null`
      });

      reply.send(updatedCoin);
    } catch (error) {
      console.error("Erro ao atualizar a solicitação:", error);
      reply.status(500).send({ error: "Erro ao atualizar a solicitação." });
    }
  });

  app.patch("/coins/:id/reject", async (request, reply) => {
    const { id } = request.params;
    const { adminId } = request.body;

    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "ADMIN") {
      return reply
        .status(403)
        .send({ error: "Apenas ADMINs podem rejeitar moedas." });
    }

    const coin = await prisma.coin.findUnique({ where: { id: Number(id) } });
    if (!coin) return reply.status(404).send({ error: "Moeda não encontrada" });

    if (coin.status !== "PENDING") {
      return reply.status(400).send({ error: "Moeda já foi processada" });
    }

    const updatedCoin = await prisma.coin.update({
      where: { id: Number(id) },
      data: {
        status: "REJECTED",
        approvedBy: adminId,
        updatedAt: new Date(),
      },
    });

    reply.send(updatedCoin);
  });

  app.delete("/coins/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      // Verifica se a solicitação existe antes de excluir
      const coinExists = await prisma.coin.findUnique({
        where: { id: Number(id) },
      });

      if (!coinExists) {
        return reply.status(404).send({ error: "Solicitação não encontrada." });
      }

      // Exclui a solicitação
      await prisma.coin.delete({
        where: { id: Number(id) },
      });

      reply.send({ message: "Solicitação excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao excluir a solicitação:", error);
      reply.status(500).send({ error: "Erro ao excluir a solicitação." });
    }
  });
}
