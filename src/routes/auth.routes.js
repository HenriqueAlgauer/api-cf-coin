import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function authRoutes(app) {
  app.post("/login", async (request, reply) => {
    const { email, password } = request.body;

    // Busca o usuário pelo email e retorna também o department
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        department: true, // Agora retorna o department
        role: true,
      },
    });

    if (!user) {
      return reply.status(401).send({ error: "Email ou senha inválidos" });
    }

    // Verifica se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.status(401).send({ error: "Email ou senha inválidos" });
    }

    // Retorna os dados necessários para o frontend
    reply.send({
      message: "Login realizado com sucesso!",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role, // Agora pega role do banco
        department: user.department,
      },
    });
  });
}
