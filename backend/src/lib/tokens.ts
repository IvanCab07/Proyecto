import crypto from 'crypto';
import { TokenType } from '@prisma/client';
import { prisma } from './prisma';
import { HttpError } from './httpError';

// ────────────────────────────────────────────────────────────────
// Tokens de un solo uso para verificar email y resetear contraseña.
// En la base guardamos SOLO el hash (sha256); el valor crudo viaja
// únicamente en el link del email. Así, aunque se filtre la DB, los
// tokens no sirven.
// ────────────────────────────────────────────────────────────────

function hashToken(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

// Crea un token nuevo invalidando los anteriores del mismo tipo (sin usar)
// para ese usuario. Devuelve el valor CRUDO que hay que poner en el link.
export async function createToken(userId: string, type: TokenType, ttlMinutes: number): Promise<string> {
  const raw = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60_000);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.verificationToken.create({ data: { userId, type, tokenHash, expiresAt } }),
  ]);

  return raw;
}

// Valida y consume un token (un solo uso). Devuelve el userId al que pertenece.
// Lanza HttpError 400 si es inválido, vencido o ya usado.
export async function consumeToken(raw: string, type: TokenType): Promise<string> {
  if (!raw || typeof raw !== 'string') {
    throw new HttpError(400, 'El enlace es inválido o expiró. Solicitá uno nuevo.');
  }

  const tokenHash = hashToken(raw);
  const record = await prisma.verificationToken.findUnique({ where: { tokenHash } });

  if (!record || record.type !== type || record.usedAt || record.expiresAt < new Date()) {
    throw new HttpError(400, 'El enlace es inválido o expiró. Solicitá uno nuevo.');
  }

  await prisma.verificationToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
  return record.userId;
}
