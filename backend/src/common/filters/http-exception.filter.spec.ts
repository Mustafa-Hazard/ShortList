import { HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let mockHost: any;

  beforeEach(() => {
    filter = new HttpExceptionFilter();
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ method: 'GET', url: '/api/test' }),
      }),
    };
  });

  it('formats standard HttpException responses correctly', () => {
    const exception = new HttpException(
      'Forbidden resource',
      HttpStatus.FORBIDDEN,
    );
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Forbidden resource',
        path: '/api/test',
      }),
    );
  });

  it('masks internal server error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const secretDbError = new Error(
        'FATAL: Database connection string mongodb://secret:pass failed',
      );
      filter.catch(secretDbError, mockHost);

      expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(mockJson).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Internal server error',
          path: '/api/test',
        }),
      );
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });
});
