import { prisma } from "../prisma/client.js";

export default async function taskRoutes(app) {
  // Criar uma nova tarefa
  app.post("/tasks", async (request, reply) => {
    try {
      const { name, description, reward, type } = request.body;

      if (
        !name ||
        !description ||
        !reward ||
        typeof reward !== "number" ||
        !type
      ) {
        return reply.status(400).send({
          error:
            "Todos os campos são obrigatórios e 'reward' deve ser um número.",
        });
      }

      if (!["ADMIN", "USER", "AMBOS"].includes(type)) {
        return reply
          .status(400)
          .send({ error: "O campo 'type' deve ser ADMIN, USER ou AMBOS." });
      }

      const task = await prisma.task.create({
        data: {
          name,
          description,
          reward,
          type, // Define a visibilidade da tarefa
        },
      });

      reply.status(201).send(task);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao criar a tarefa." });
    }
  });

  // Listar todas as tarefas filtradas por tipo
  app.get("/tasks", async (request, reply) => {
    try {
      const { role } = request.query; // Filtra por usuário ADMIN ou USER

      const whereClause = role
        ? {
            OR: [{ type: "AMBOS" }, { type: role }],
          }
        : {}; // Retorna todas se nenhum filtro for passado

      const tasks = await prisma.task.findMany({ where: whereClause });

      reply.send(tasks);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao buscar as tarefas." });
    }
  });

  // Atualizar uma tarefa pelo ID
  app.put("/tasks/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, reward, type } = request.body;

      if (
        !name &&
        !description &&
        (reward === undefined || reward === null) &&
        !type
      ) {
        return reply
          .status(400)
          .send({ error: "Forneça pelo menos um campo para atualizar." });
      }

      const task = await prisma.task.update({
        where: { id: Number(id) },
        data: {
          name,
          description,
          reward,
          type,
        },
      });

      reply.send(task);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao atualizar a tarefa." });
    }
  });
}
