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

  app.get("/users/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
        select: {
          name: true,
          email: true,
          department: true,
          coins: true,
        },
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado." });
      }

      reply.send(user);
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      reply.status(500).send({ error: "Erro ao buscar usuário." });
    }
  });

  // ✅ Atualizar apenas o email do usuário
  app.patch("/users/:id/email", async (request, reply) => {
    try {
      const { id } = request.params;
      const { email } = request.body;

      if (!email) {
        return reply
          .status(400)
          .send({ error: "O campo 'email' é obrigatório." });
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: { email },
        select: {
          name: true,
          email: true,
          department: true,
          coins: true,
        },
      });

      reply.send(updatedUser);
    } catch (error) {
      console.error("Erro ao atualizar o email do usuário:", error);
      reply
        .status(500)
        .send({ error: "Erro ao atualizar o email do usuário." });
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

  app.delete("/users/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      // 🔥 Apaga todas as coins associadas ao usuário antes de excluí-lo
      await prisma.coin.deleteMany({
        where: { userId: Number(id) },
      });

      // 🔥 Agora podemos excluir o usuário sem violação de chave estrangeira
      await prisma.user.delete({
        where: { id: Number(id) },
      });

      reply.send({ message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao excluir o usuário" });
    }
  });

  app.patch("/users/:id", async (request, reply) => {
    const { id } = request.params;
    const { name, email, department, role, coins } = request.body;

    try {
      const user = await prisma.user.findUnique({
        where: { id: Number(id) },
      });

      if (!user) {
        return reply.status(404).send({ error: "Usuário não encontrado" });
      }

      const updatedUser = await prisma.user.update({
        where: { id: Number(id) },
        data: { name, email, department, role, coins },
      });

      reply.send(updatedUser);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao atualizar o usuário" });
    }
  });
}
