import { prisma } from "../prisma/client.js";

export default async function taskRoutes(app) {
  // Criar uma nova tarefa
  app.post("/tasks", async (request, reply) => {
    try {
      const { name, description, reward, visibility } = request.body;

      if (
        !name ||
        !description ||
        reward === undefined ||
        typeof reward !== "number" ||
        !visibility
      ) {
        return reply.status(400).send({
          error:
            "Todos os campos são obrigatórios, e 'reward' deve ser um número.",
        });
      }

      if (!["ADMIN", "USER", "AMBOS"].includes(visibility)) {
        return reply.status(400).send({
          error: "O campo 'visibility' deve ser ADMIN, USER ou AMBOS.",
        });
      }

      const task = await prisma.task.create({
        data: {
          name,
          description,
          reward,
          visibility, // ✅ Correção do nome do campo
        },
      });

      reply.status(201).send(task);
    } catch (error) {
      console.error("Erro ao criar a tarefa:", error);
      reply.status(500).send({ error: "Erro interno ao criar a tarefa." });
    }
  });

  // Listar todas as tarefas filtradas por tipo
  // Atualizar uma tarefa pelo ID
  app.put("/tasks/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, reward, visibility } = request.body;

      if (
        !name &&
        !description &&
        (reward === undefined || reward === null) &&
        !visibility
      ) {
        return reply
          .status(400)
          .send({ error: "Forneça pelo menos um campo para atualizar." });
      }

      if (visibility && !["ADMIN", "USER", "AMBOS"].includes(visibility)) {
        return reply.status(400).send({
          error: "O campo 'visibility' deve ser ADMIN, USER ou AMBOS.",
        });
      }

      const task = await prisma.task.update({
        where: { id: Number(id) },
        data: {
          ...(name && { name }),
          ...(description && { description }),
          ...(reward !== undefined && reward !== null && { reward }),
          ...(visibility && { visibility }),
        },
      });

      reply.send(task);
    } catch (error) {
      console.error("Erro ao atualizar a tarefa:", error);
      reply.status(500).send({ error: "Erro ao atualizar a tarefa." });
    }
  });

  // Listar todas as tarefas, filtrando por role se necessário
  app.get("/tasks", async (request, reply) => {
    try {
      const { role } = request.query; // Filtra por ADMIN, USER ou retorna todas

      const whereClause = role
        ? {
            OR: [{ visibility: "AMBOS" }, { visibility: role }],
          }
        : {}; // Retorna todas se nenhum filtro for passado

      const tasks = await prisma.task.findMany({ where: whereClause });

      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar as tarefas:", error);
      reply.status(500).send({ error: "Erro ao buscar as tarefas." });
    }
  });

  app.get("/tasks/user", async (request, reply) => {
    try {
      const tasks = await prisma.task.findMany({
        where: {
          OR: [{ visibility: "AMBOS" }, { visibility: "USER" }],
        },
      });
      reply.send(tasks);
    } catch (error) {
      console.error("Erro ao buscar tarefas para usuário:", error);
      reply.status(500).send({ error: "Erro ao buscar tarefas." });
    }
  });

  app.delete("/tasks/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      // Verifica se a tarefa existe antes de tentar excluir
      const taskExists = await prisma.task.findUnique({
        where: { id: Number(id) },
      });

      if (!taskExists) {
        return reply.status(404).send({ error: "Tarefa não encontrada." });
      }

      // Exclui a tarefa
      await prisma.task.delete({
        where: { id: Number(id) },
      });

      reply.send({ message: "Tarefa deletada com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar a tarefa:", error);
      reply.status(500).send({ error: "Erro ao deletar a tarefa." });
    }
  });
}
