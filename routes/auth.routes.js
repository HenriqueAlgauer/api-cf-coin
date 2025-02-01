import bcrypt from "bcrypt";
import { prisma } from "../prisma/client.js";

export default async function authRoutes(app) {
  app.post("/login", async (request, reply) => {
    const { email, password } = request.body;

    // Busca o usuário pelo email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return reply.status(401).send({ error: "Email ou senha inválidos" });
    }

    // Verifica se a senha está correta
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return reply.status(401).send({ error: "Email ou senha inválidos" });
    }

    reply.send({ message: "Login realizado com sucesso!" });
  });
}
