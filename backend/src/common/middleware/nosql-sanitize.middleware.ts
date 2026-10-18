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
    for (let i = 0; i < obj.length; i++) {
      sanitizeInput(obj[i]);
    }
    return obj;
  }

  for (const key of Object.keys(obj)) {
    if (
      key === '__proto__' ||
      key === 'constructor' ||
      key === 'prototype' ||
      key.startsWith('$') ||
      key.includes('.')
    ) {
      throw new BadRequestException(
        `Invalid request input: key "${key}" contains prohibited NoSQL operator characters ($ or .) or prototype keys`,
      );
    }
    sanitizeInput(obj[key]);
  }
  return obj;
}

@Injectable()
export class NoSqlSanitizeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    if (req.body) {
      sanitizeInput(req.body);
    }
    if (req.query) {
      sanitizeInput(req.query);
    }
    if (req.params) {
      sanitizeInput(req.params);
    }
    next();
  }
}
