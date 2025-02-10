import { prisma } from "../../prisma/client";

/**
 * Middleware para verificar se o usuário é ADMIN.
 * Idealmente, as informações do usuário viriam do token (request.user),
 * mas aqui usamos o adminId enviado no body.
 */
export async function verifyAdmin(request, reply) {
  const adminId = request.body.adminId;
  if (!adminId) {
    reply.status(401).send({ error: "AdminId não informado." });
    return;
  }

  const admin = await prisma.user.findUnique({
    where: { id: Number(adminId) },
  });

  if (!admin || admin.role !== "ADMIN") {
    reply.status(403).send({
      error: "Acesso negado: apenas ADMINs podem executar essa operação.",
    });
    return;
  }
}
