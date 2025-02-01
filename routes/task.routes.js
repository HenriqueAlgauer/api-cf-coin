import { prisma } from "../prisma/client.js";

export default async function taskRoutes(app) {
  // Criar uma nova tarefa
  app.post("/tasks", async (request, reply) => {
    try {
      const { name, description, reward } = request.body;

      if (!name || !description || !reward || typeof reward !== "number") {
        return reply
          .status(400)
          .send({
            error:
              "Todos os campos são obrigatórios e 'reward' deve ser um número.",
          });
      }

      const task = await prisma.task.create({
        data: {
          name,
          description,
          reward,
        },
      });

      reply.status(201).send(task);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao criar a tarefa." });
    }
  });

  // Listar todas as tarefas
  app.get("/tasks", async (request, reply) => {
    try {
      const tasks = await prisma.task.findMany();
      reply.send(tasks);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao buscar as tarefas." });
    }
  });

  // Obter uma tarefa específica pelo ID
  app.get("/tasks/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      const task = await prisma.task.findUnique({
        where: { id: Number(id) },
      });

      if (!task) {
        return reply.status(404).send({ error: "Tarefa não encontrada." });
      }

      reply.send(task);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao buscar a tarefa." });
    }
  });

  // Atualizar uma tarefa pelo ID
  app.put("/tasks/:id", async (request, reply) => {
    try {
      const { id } = request.params;
      const { name, description, reward } = request.body;

      if (!name && !description && (reward === undefined || reward === null)) {
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
        },
      });

      reply.send(task);
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao atualizar a tarefa." });
    }
  });

  // Deletar uma tarefa pelo ID
  app.delete("/tasks/:id", async (request, reply) => {
    try {
      const { id } = request.params;

      await prisma.task.delete({
        where: { id: Number(id) },
      });

      reply.send({ message: "Tarefa deletada com sucesso." });
    } catch (error) {
      console.error(error);
      reply.status(500).send({ error: "Erro ao deletar a tarefa." });
    }
  });
}
