// src/services/user.service.js
import { prisma } from "../prisma/client.js";
import bcrypt from "bcrypt";

/**
 * Lista todos os usuários com role "USER".
 */
export async function getUsersService() {
  const users = await prisma.user.findMany({
    where: { role: "USER" },
    select: {
      id: true,
      name: true,
      email: true,
      coins: true,
      department: true,
      role: true,
    },
  });
  return users;
}

/**
 * Obtém os dados de um usuário pelo ID.
 */
export async function getUserByIdService(id) {
  return await prisma.user.findUnique({
    where: { id },
    select: { name: true, email: true, department: true, coins: true },
  });
}

/**
 * Atualiza o email de um usuário.
 */
export async function updateUserEmailService(id, email) {
  return await prisma.user.update({
    where: { id },
    data: { email },
    select: { name: true, email: true, department: true, coins: true },
  });
}

/**
 * Agrega o total de coins aprovadas de um usuário.
 */
export async function getUserCoinsService(id) {
  const totalCoins = await prisma.coin.aggregate({
    where: { userId: id, status: "APPROVED" },
    _sum: { amount: true },
  });
  return { userId: id, totalCoins: totalCoins._sum.amount || 0 };
}

/**
 * Retorna todas as transações (coins) de um usuário.
 */
export async function getUserTransactionsService(id) {
  return await prisma.coin.findMany({
    where: { userId: id },
  });
}

/**
 * Cria um novo usuário.
 */
export async function createUserService({
  name,
  email,
  password,
  department,
  role,
}) {
  // Verifica se o email já existe
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error("Email já cadastrado");

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, department, role },
  });
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    department: user.department,
    role: user.role,
  };
}

/**
 * Exclui um usuário e suas coins associadas.
 */
export async function deleteUserService(id) {
  // Apaga as coins associadas
  await prisma.coin.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
}

/**
 * Atualiza os dados de um usuário.
 */
export async function updateUserService(id, data) {
  return await prisma.user.update({
    where: { id },
    data,
  });
}
