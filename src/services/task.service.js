// src/services/task.service.js
import { prisma } from "../../prisma/client.js";

/**
 * Cria uma nova tarefa.
 */
export async function createTaskService({
  name,
  description,
  reward,
  visibility,
}) {
  const task = await prisma.task.create({
    data: { name, description, reward, visibility },
  });
  return task;
}

/**
 * Atualiza os dados de uma tarefa.
 */
export async function updateTaskService({
  id,
  name,
  description,
  reward,
  visibility,
}) {
  const updatedTask = await prisma.task.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(reward !== undefined && reward !== null && { reward }),
      ...(visibility && { visibility }),
    },
  });
  return updatedTask;
}

/**
 * Deleta uma tarefa.
 */
export async function deleteTaskService(id) {
  // Verifica se a tarefa existe
  const taskExists = await prisma.task.findUnique({ where: { id } });
  if (!taskExists) throw new Error("Tarefa não encontrada.");
  await prisma.task.delete({ where: { id } });
}

/**
 * Lista tarefas, filtrando por role se informado.
 */
export async function getTasksService(role) {
  let whereClause = {};
  if (role) {
    whereClause = {
      OR: [{ visibility: "AMBOS" }, { visibility: role }],
    };
  }
  const tasks = await prisma.task.findMany({ where: whereClause });
  return tasks;
}

/**
 * Lista as tarefas com visibilidade "USER" ou "AMBOS".
 */
export async function getUserTasksService() {
  const tasks = await prisma.task.findMany({
    where: {
      OR: [{ visibility: "AMBOS" }, { visibility: "USER" }],
    },
  });
  return tasks;
}
