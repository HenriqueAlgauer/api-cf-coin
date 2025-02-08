// src/controllers/user.controller.js
import {
  getUsersService,
  getUserByIdService,
  updateUserEmailService,
  getUserCoinsService,
  getUserTransactionsService,
  createUserService,
  deleteUserService,
  updateUserService,
} from "../services/user.service.js";

/**
 * Lista todos os usuários com role "USER".
 */
export async function getUsers(req, reply) {
  try {
    const users = await getUsersService();
    reply.send(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    reply.status(500).send({ error: "Erro ao buscar usuários" });
  }
}

/**
 * Obtém os dados de um usuário pelo ID.
 */
export async function getUserById(req, reply) {
  try {
    const { id } = req.params;
    const user = await getUserByIdService(Number(id));
    if (!user)
      return reply.status(404).send({ error: "Usuário não encontrado." });
    reply.send(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    reply.status(500).send({ error: "Erro ao buscar usuário." });
  }
}

/**
 * Atualiza apenas o email de um usuário.
 */
export async function updateUserEmail(req, reply) {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email)
      return reply
        .status(400)
        .send({ error: "O campo 'email' é obrigatório." });
    const updatedUser = await updateUserEmailService(Number(id), email);
    reply.send(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar o email do usuário:", error);
    reply.status(500).send({ error: "Erro ao atualizar o email do usuário." });
  }
}

/**
 * Retorna o total de moedas do usuário (somente coins aprovadas).
 */
export async function getUserCoins(req, reply) {
  try {
    const { id } = req.params;
    const result = await getUserCoinsService(Number(id));
    reply.send(result);
  } catch (error) {
    console.error("Erro ao buscar moedas do usuário:", error);
    reply.status(500).send({ error: "Erro ao buscar as moedas do usuário." });
  }
}

/**
 * Lista as transações (coins) de um usuário.
 */
export async function getUserTransactions(req, reply) {
  try {
    const { id } = req.params;
    const transactions = await getUserTransactionsService(Number(id));
    reply.send(transactions);
  } catch (error) {
    console.error("Erro ao buscar transações do usuário:", error);
    reply.status(500).send({ error: "Erro ao buscar transações do usuário." });
  }
}

/**
 * Cria um novo usuário.
 */
export async function createUser(req, reply) {
  try {
    const { name, email, password, department, role } = req.body;
    const user = await createUserService({
      name,
      email,
      password,
      department,
      role,
    });
    reply.status(201).send(user);
  } catch (error) {
    console.error("Erro ao criar usuário:", error);
    reply
      .status(500)
      .send({ error: error.message || "Erro ao criar usuário." });
  }
}

/**
 * Exclui um usuário (e suas coins associadas).
 */
export async function deleteUser(req, reply) {
  try {
    const { id } = req.params;
    await deleteUserService(Number(id));
    reply.send({ message: "Usuário excluído com sucesso" });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    reply.status(500).send({ error: "Erro ao excluir o usuário" });
  }
}

/**
 * Atualiza os dados de um usuário.
 */
export async function updateUser(req, reply) {
  try {
    const { id } = req.params;
    const { name, email, department, role, coins } = req.body;
    const updatedUser = await updateUserService(Number(id), {
      name,
      email,
      department,
      role,
      coins,
    });
    reply.send(updatedUser);
  } catch (error) {
    console.error("Erro ao atualizar o usuário:", error);
    reply.status(500).send({ error: "Erro ao atualizar o usuário" });
  }
}
