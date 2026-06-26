import { CorsOptions } from 'cors';
import { CORS_ORIGIN } from './env';

// CORS_ORIGIN puede ser "*" (cualquier origen) o una lista separada por comas
// con los dominios permitidos (ej: "https://miweb.vercel.app,https://otra.com").
const lista = CORS_ORIGIN.split(',').map((s) => s.trim()).filter(Boolean);
const permitirTodo = lista.length === 0 || lista.includes('*');

export const corsOptions: CorsOptions = permitirTodo
  ? { origin: '*' }
  : {
      origin: (origin, cb) => {
        // Sin Origin (app móvil, curl) o en la lista blanca → permitido
        if (!origin || lista.includes(origin)) return cb(null, true);
        cb(new Error('Origen no permitido por CORS'));
      },
    };
