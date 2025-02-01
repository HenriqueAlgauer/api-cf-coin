import { prisma } from "../prisma/client.js";
import bcrypt from "bcrypt";

export default async function userRoutes(app) {
  // Obter saldo total de moedas do usuário
  app.get("/users", async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: "USER", // Filtra apenas usuários comuns
        },
        select: {
          id: true,
          name: true,
          email: true, // 🔹 Adiciona o email
          coins: true,
          department: true, // 🔹 Adiciona o departamento
          role: true, // 🔹 Adiciona o cargo (USER ou ADMIN)
        },
      });

      reply.send(users);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      reply.status(500).send({ error: "Erro ao buscar usuários" });
    }
  });

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

  app.post("/users", async (request, reply) => {
    const { name, email, password, department, role } = request.body;

    // Verifica se o email já está cadastrado
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return reply.status(400).send({ error: "Email já cadastrado" });
    }

    // Gera o hash da senha
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department,
        role,
      },
    });

    reply.status(201).send({
      id: user.id,
      name: user.name,
      email: user.email,
      department: user.department,
      role: user.role,
    });
  });
}
