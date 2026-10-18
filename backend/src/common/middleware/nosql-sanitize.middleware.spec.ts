import { BadRequestException } from '@nestjs/common';
import { NoSqlSanitizeMiddleware } from './nosql-sanitize.middleware';
import type { Request, Response } from 'express';

describe('NoSqlSanitizeMiddleware', () => {
  let middleware: NoSqlSanitizeMiddleware;

  beforeEach(() => {
    middleware = new NoSqlSanitizeMiddleware();
  });

  it('allows safe payloads without modification', () => {
    const req = {
      body: { email: 'user@example.com', name: 'John Doe', age: 30 },
      query: { page: '1', limit: '10' },
      params: { id: '123' },
    } as unknown as Request;
    const next = jest.fn();

    middleware.use(req, {} as Response, next);
    expect(next).toHaveBeenCalled();
    expect(req.body).toEqual({
      email: 'user@example.com',
      name: 'John Doe',
      age: 30,
    });
  });

  it('throws BadRequestException when body contains $-prefixed operator keys', () => {
    const req = {
      body: { email: 'user@example.com', password: { $gt: '' } },
      query: {},
      params: {},
    } as unknown as Request;
    const next = jest.fn();

    expect(() => middleware.use(req, {} as Response, next)).toThrow(
      BadRequestException,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when query contains dotted keys', () => {
    const req = {
      body: {},
      query: { 'profile.role': 'admin' },
      params: {},
    } as unknown as Request;
    const next = jest.fn();

    expect(() => middleware.use(req, {} as Response, next)).toThrow(
      BadRequestException,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('throws BadRequestException when nested array contains $-prefixed keys', () => {
    const req = {
      body: { filters: [{ validKey: 'val' }, { $where: 'sleep(1000)' }] },
      query: {},
      params: {},
    } as unknown as Request;
    const next = jest.fn();

    expect(() => middleware.use(req, {} as Response, next)).toThrow(
      BadRequestException,
    );
  });
});
