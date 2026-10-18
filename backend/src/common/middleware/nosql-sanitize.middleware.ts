import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';

export function sanitizeInput(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeInput(item));
  }

  const cleanObj: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      throw new BadRequestException(
        `Invalid request input: key "${key}" contains prohibited NoSQL operator characters ($ or .)`,
      );
    }
    cleanObj[key] = sanitizeInput(obj[key]);
  }
  return cleanObj;
}

@Injectable()
export class NoSqlSanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body) {
      req.body = sanitizeInput(req.body);
    }
    if (req.query) {
      req.query = sanitizeInput(req.query);
    }
    if (req.params) {
      req.params = sanitizeInput(req.params);
    }
    next();
  }
}
