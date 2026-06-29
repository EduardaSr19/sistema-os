import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const loginSchema = z.object({
  email: z.string().email(),
  senha: z.string().min(1),
});

function gerarToken(user) {
  return jwt.sign(
    { role: user.role, lojaId: user.lojaId ?? null },
    process.env.JWT_SECRET,
    { subject: user.id, expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function semSenha({ senha, ...rest }) {
  return rest;
}

export async function login(req, res, next) {
  try {
    const { email, senha } = loginSchema.parse(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { loja: { select: { id: true, nome: true, ativa: true } } },
    });
    if (!user) return res.status(401).json({ error: "E-mail ou senha incorretos." });

    // Loja desativada bloqueia o acesso (exceto SUPERADMIN)
    if (user.role !== "SUPERADMIN" && user.loja && !user.loja.ativa)
      return res.status(403).json({ error: "Esta loja está desativada." });

    const ok = await bcrypt.compare(senha, user.senha);
    if (!ok) return res.status(401).json({ error: "E-mail ou senha incorretos." });

    return res.json({ user: semSenha(user), token: gerarToken(user) });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { loja: { select: { id: true, nome: true } } },
    });
    if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
    return res.json(semSenha(user));
  } catch (err) {
    next(err);
  }
}
