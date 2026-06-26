import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


export type AppRole = 'PATIENT' | 'ADMIN' | 'MEDICO';

export interface JwtPayload {
  userId: string;
  role: AppRole;
  email: string;
}


declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}


export const verifyToken = (req: Request, res: Response, next: NextFunction) => {

  const authHeader = req.headers.authorization;


  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }


  const token = authHeader.split(' ')[1];

  try {

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload & { purpose?: string };

    // Los tokens "challenge" del 2do paso de login (2FA) llevan `purpose` y
    // NO sirven para autenticarse en rutas normales: solo en /auth/2fa/login.
    if (decoded.purpose) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }

    req.user = decoded;


    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};


export const requireRole = (...roles: AppRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {

    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }


    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acceso denegado: rol insuficiente' });
    }

    next();
  };
};


export const requireAdmin = requireRole('ADMIN');
export const requirePatient = requireRole('PATIENT', 'ADMIN');
export const requireMedico = requireRole('MEDICO');
export const requireMedicoOrAdmin = requireRole('MEDICO', 'ADMIN');
