import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const registerSchema = z.object({
  nome: z.string().min(2, "Nome muito curto."),
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(6, "A senha deve ter ao menos 6 caracteres."),
  role: z.enum(["ADMIN", "TECNICO"]).optional(),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido."),
  senha: z.string().min(1, "Informe a senha."),
});

function gerarToken(user) {
  return jwt.sign({ role: user.role }, process.env.JWT_SECRET, {
    subject: user.id,
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

// Remove o campo senha antes de devolver o usuário ao cliente.
function semSenha(user) {
  const { senha, ...rest } = user;
  return rest;
}

export async function register(req, res, next) {
  try {
    const { nome, email, senha, role } = registerSchema.parse(req.body);
    const hash = await bcrypt.hash(senha, 10);

    const user = await prisma.user.create({
      data: { nome, email, senha: hash, role },
    });

    return res.status(201).json({
      user: semSenha(user),
      token: gerarToken(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, senha } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    const senhaOk = await bcrypt.compare(senha, user.senha);
    if (!senhaOk) {
      return res.status(401).json({ error: "E-mail ou senha incorretos." });
    }

    return res.json({
      user: semSenha(user),
      token: gerarToken(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    return res.json(semSenha(user));
  } catch (err) {
    next(err);
  }
}
