import { prisma } from "../prisma/client.js";

export default async function userRoutes(app) {
  // Obter saldo total de moedas do usuário
  app.get("/users/:id/coins", async (request, reply) => {
    const { id } = request.params;

    const totalCoins = await prisma.coin.aggregate({
      where: { userId: Number(id), status: "APPROVED" }, // Só conta moedas aprovadas
      _sum: { amount: true },
    });

    reply.send({ userId: id, totalCoins: totalCoins._sum.amount || 0 });
  });

  app.get("/users/:id/transactions", async (request, reply) => {
    const { id } = request.params;

    const transactions = await prisma.coin.findMany({
      where: { userId: Number(id) },
    });

    reply.send(transactions);
  });
}
