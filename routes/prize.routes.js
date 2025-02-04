import { prisma } from "../prisma/client.js";

export default async function prizeRoutes(app) {
  // ✅ Criar um novo prêmio (ADMIN)
  app.post("/prizes", async (request, reply) => {
    try {
      const { name, description, cost } = request.body;

      if (
        !name ||
        !description ||
        cost === undefined ||
        typeof cost !== "number"
      ) {
        return reply
          .status(400)
          .send({ error: "Todos os campos são obrigatórios." });
      }

      const prize = await prisma.prize.create({
        data: { name, description, cost },
      });

      reply.status(201).send(prize);
    } catch (error) {
      console.error("Erro ao criar prêmio:", error);
      reply.status(500).send({ error: "Erro ao criar prêmio." });
    }
  });

  // ✅ Listar todos os prêmios
  app.get("/prizes", async (request, reply) => {
    try {
      const prizes = await prisma.prize.findMany();
      reply.send(prizes);
    } catch (error) {
      console.error("Erro ao buscar prêmios:", error);
      reply.status(500).send({ error: "Erro ao buscar prêmios." });
    }
  });

  // ✅ Atualizar um prêmio (ADMIN)
  app.put("/prizes/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, cost } = request.body;

      const prize = await prisma.prize.update({
        where: { id: Number(id) },
        data: { name, description, cost },
      });

      reply.send(prize);
    } catch (error) {
      console.error("Erro ao atualizar prêmio:", error);
      reply.status(500).send({ error: "Erro ao atualizar prêmio." });
    }
  });

  // ✅ Deletar um prêmio (ADMIN)
  app.delete("/prizes/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.prize.delete({ where: { id: Number(id) } });

      reply.send({ message: "Prêmio deletado com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar prêmio:", error);
      reply.status(500).send({ error: "Erro ao deletar prêmio." });
    }
  });

  // ✅ Solicitar resgate de prêmio (Usuário)
  app.post("/prize-redemptions", async (request, reply) => {
    try {
      const { userId, prizeId } = request.body;

      if (!userId || !prizeId) {
        return reply
          .status(400)
          .send({ error: "Usuário e Prêmio são obrigatórios." });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      const prize = await prisma.prize.findUnique({ where: { id: prizeId } });

      if (!user)
        return reply.status(404).send({ error: "Usuário não encontrado." });
      if (!prize)
        return reply.status(404).send({ error: "Prêmio não encontrado." });

      if (user.coins < prize.cost) {
        return reply
          .status(400)
          .send({ error: "Moedas insuficientes para resgatar este prêmio." });
      }

      // 🔹 Subtrai as moedas do usuário imediatamente
      await prisma.user.update({
        where: { id: userId },
        data: { coins: { decrement: prize.cost } },
      });

      // 🔹 Cria a solicitação de resgate com status "PENDING"
      const redemption = await prisma.prizeRedemption.create({
        data: { userId, prizeId, status: "PENDING" },
      });

      reply.status(201).send(redemption);
    } catch (error) {
      console.error("Erro ao solicitar resgate:", error);
      reply.status(500).send({ error: "Erro ao solicitar resgate." });
    }
  });

  // ✅ Listar resgates pendentes (ADMIN)
  app.get("/prize-redemptions/pending", async (request, reply) => {
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
  });

  // ✅ Aprovar ou Rejeitar Resgate de Prêmio (ADMIN)
  app.patch("/prize-redemptions/:id/approve", async (request, reply) => {
    try {
      const { id } = request.params;
      console.log("🔹 Recebendo solicitação de aprovação para o ID:", id);

      // Verifica se o ID é um número válido
      if (isNaN(Number(id))) {
        console.error("❌ ID inválido:", id);
        return reply.status(400).send({ error: "ID inválido para aprovação." });
      }

      // Busca a solicitação de resgate com os dados do prêmio
      const redemption = await prisma.prizeRedemption.findUnique({
        where: { id: Number(id) },
        include: { prize: true }, // Inclui detalhes do prêmio
      });

      if (!redemption) {
        console.error("❌ Resgate não encontrado para o ID:", id);
        return reply.status(404).send({ error: "Resgate não encontrado." });
      }

      // Verifica se o usuário tem saldo suficiente
      const user = await prisma.user.findUnique({
        where: { id: redemption.userId },
      });

      if (!user) {
        console.error("❌ Usuário não encontrado:", redemption.userId);
        return reply.status(404).send({ error: "Usuário não encontrado." });
      }

      if (user.coins < redemption.prize.cost) {
        console.error(
          `❌ Moedas insuficientes: Usuário tem ${user.coins}, precisa de ${redemption.prize.cost}`
        );
        return reply.status(400).send({
          error: "Usuário não tem CF Coins suficientes para este resgate.",
        });
      }

      // Atualiza o status para "APPROVED"
      const updatedRequest = await prisma.prizeRedemption.update({
        where: { id: Number(id) },
        data: { status: "APPROVED" },
      });

      // Subtrai os CF Coins do usuário
      await prisma.user.update({
        where: { id: redemption.userId },
        data: { coins: { decrement: redemption.prize.cost } },
      });

      console.log("✅ Resgate aprovado com sucesso:", updatedRequest);
      reply.send(updatedRequest);
    } catch (error) {
      console.error("❌ Erro ao aprovar o resgate:", error);
      reply.status(500).send({ error: "Erro ao aprovar o resgate." });
    }
  });

  app.patch("/prize-redemptions/:id/reject", async (request, reply) => {
    try {
      const { id } = request.params;
      const redemption = await prisma.prizeRedemption.findUnique({
        where: { id: Number(id) },
        include: { prize: true, user: true }, // Precisamos do usuário e do prêmio para restaurar os coins
      });

      if (!redemption)
        return reply.status(404).send({ error: "Resgate não encontrado." });

      if (redemption.status !== "PENDING") {
        return reply
          .status(400)
          .send({ error: "A solicitação já foi processada." });
      }

      // 🔹 Devolve as moedas ao usuário
      await prisma.user.update({
        where: { id: redemption.userId },
        data: { coins: { increment: redemption.prize.cost } },
      });

      // 🔹 Atualiza o status para "REJECTED"
      const updatedRequest = await prisma.prizeRedemption.update({
        where: { id: Number(id) },
        data: { status: "REJECTED" },
      });

      reply.send(updatedRequest);
    } catch (error) {
      console.error("Erro ao rejeitar o resgate:", error);
      reply.status(500).send({ error: "Erro ao rejeitar o resgate." });
    }
  });

  // ✅ Listar resgates de um usuário específico
  app.get("/prize-redemptions/user/:userId", async (request, reply) => {
    try {
      const { userId } = request.params;

      const userRedemptions = await prisma.prizeRedemption.findMany({
        where: { userId: Number(userId) },
        include: { prize: { select: { name: true, cost: true } } },
      });

      reply.send(userRedemptions);
    } catch (error) {
      console.error("Erro ao buscar resgates do usuário:", error);
      reply.status(500).send({ error: "Erro ao buscar resgates." });
    }
  });
}
