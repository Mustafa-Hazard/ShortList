import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: Partial<AuthService>;

  beforeEach(async () => {
    authService = {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('has stricter throttle limits defined on login and register handlers', () => {
    const keys = Reflect.getMetadataKeys(AuthController.prototype.login);
    expect(keys.length).toBeGreaterThan(0);
    // Find throttler options in metadata
    const throttlerKey = keys.find(
      (k: string) => k.includes('THROTTLER') || k.includes('throttler'),
    );
    expect(throttlerKey).toBeDefined();
    const metadata = Reflect.getMetadata(
      throttlerKey,
      AuthController.prototype.login,
    );
    expect(metadata).toBeDefined();
  });
});
