// src/controllers/task.controller.js
import {
  createTaskService,
  updateTaskService,
  deleteTaskService,
  getTasksService,
  getUserTasksService,
} from "../services/task.service.js";

/**
 * Cria uma nova tarefa.
 */
export async function createTask(req, reply) {
  try {
    const { name, description, reward, visibility } = req.body;

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

    const task = await createTaskService({
      name,
      description,
      reward,
      visibility,
    });
    reply.status(201).send(task);
  } catch (error) {
    console.error("Erro ao criar a tarefa:", error);
    if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      reply
        .status(400)
        .send({ error: "Já existe uma tarefa com este nome. Tente outro." });
    } else {
      reply.status(500).send({ error: "Erro interno ao criar a tarefa." });
    }
  }
}

/**
 * Atualiza uma tarefa existente.
 */
export async function updateTask(req, reply) {
  try {
    const { id } = req.params;
    const { name, description, reward, visibility } = req.body;

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
      return reply
        .status(400)
        .send({ error: "O campo 'visibility' deve ser ADMIN, USER ou AMBOS." });
    }

    const task = await updateTaskService({
      id: Number(id),
      name,
      description,
      reward,
      visibility,
    });
    reply.send(task);
  } catch (error) {
    console.error("Erro ao atualizar a tarefa:", error);
    if (error.code === "P2025") {
      reply.status(404).send({ error: "Tarefa não encontrada." });
    } else if (error.code === "P2002" && error.meta?.target?.includes("name")) {
      reply
        .status(400)
        .send({ error: "Já existe uma tarefa com este nome. Tente outro." });
    } else {
      reply.status(500).send({ error: "Erro ao atualizar a tarefa." });
    }
  }
}

/**
 * Lista todas as tarefas (opcionalmente filtradas por role).
 */
export async function getTasks(req, reply) {
  try {
    const { role } = req.query; // Ex: role=USER ou role=ADMIN
    const tasks = await getTasksService(role);
    reply.send(tasks);
  } catch (error) {
    console.error("Erro ao buscar as tarefas:", error);
    reply.status(500).send({ error: "Erro ao buscar as tarefas." });
  }
}

/**
 * Lista as tarefas disponíveis para usuário (visibilidade USER ou AMBOS).
 */
export async function getUserTasks(req, reply) {
  try {
    const tasks = await getUserTasksService();
    reply.send(tasks);
  } catch (error) {
    console.error("Erro ao buscar tarefas para usuário:", error);
    reply.status(500).send({ error: "Erro ao buscar tarefas." });
  }
}

/**
 * Deleta uma tarefa pelo ID.
 */
export async function deleteTask(req, reply) {
  try {
    const { id } = req.params;
    await deleteTaskService(Number(id));
    reply.send({ message: "Tarefa deletada com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar a tarefa:", error);
    if (error.code === "P2025") {
      reply.status(404).send({ error: "Tarefa não encontrada para exclusão." });
    } else {
      reply.status(500).send({ error: "Erro ao deletar a tarefa." });
    }
  }
}
