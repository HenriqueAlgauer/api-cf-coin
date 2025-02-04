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
      let { userId, prizeId } = request.body;

      // Converta para número caso venham como string
      userId = Number(userId);
      prizeId = Number(prizeId);

      if (!userId || isNaN(userId) || !prizeId || isNaN(prizeId)) {
        return reply.status(400).send({
          error: "Usuário e Prêmio são obrigatórios e devem ser números.",
        });
      }

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado." });
      }

      const prize = await prisma.prize.findUnique({ where: { id: prizeId } });
      if (!prize) {
        return reply.status(404).send({ error: "Prêmio não encontrado." });
      }

      if (user.coins < prize.cost) {
        return reply
          .status(403) // ❌ Código HTTP adequado para "Forbidden"
          .send({ error: "Moedas insuficientes para resgatar este prêmio." });
      }

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
  app.patch("/prize-redemptions/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { status, adminId } = request.body;

      if (!["APPROVED", "REJECTED"].includes(status)) {
        return reply.status(400).send({ error: "Status inválido." });
      }

      const redemption = await prisma.prizeRedemption.findUnique({
        where: { id: Number(id) },
      });

      if (!redemption)
        return reply.status(404).send({ error: "Resgate não encontrado." });

      if (status === "APPROVED") {
        const user = await prisma.user.findUnique({
          where: { id: redemption.userId },
        });
        const prize = await prisma.prize.findUnique({
          where: { id: redemption.prizeId },
        });

        if (!user || !prize) {
          return reply
            .status(404)
            .send({ error: "Usuário ou prêmio não encontrado." });
        }

        if (user.coins < prize.cost) {
          return reply
            .status(400)
            .send({ error: "Usuário não tem moedas suficientes." });
        }

        await prisma.user.update({
          where: { id: user.id },
          data: { coins: user.coins - prize.cost },
        });
      }

      const updatedRedemption = await prisma.prizeRedemption.update({
        where: { id: Number(id) },
        data: { status, approvedBy: adminId || null },
      });

      reply.send(updatedRedemption);
    } catch (error) {
      console.error("Erro ao aprovar/rejeitar resgate:", error);
      reply.status(500).send({ error: "Erro ao processar resgate." });
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
