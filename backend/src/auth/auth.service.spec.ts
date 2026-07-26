import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { Role } from '../common/enums/role.enum';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let companiesService: jest.Mocked<CompaniesService>;
  let jwtService: jest.Mocked<JwtService>;

  const fakeUser = {
    id: 'user-1',
    email: 'candidate@example.com',
    passwordHash: '',
    firstName: 'Ada',
    lastName: 'Lovelace',
    role: Role.CANDIDATE,
    companyId: null,
    refreshTokenHash: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    fakeUser.passwordHash = await bcrypt.hash('correct-password', 10);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            setRefreshTokenHash: jest.fn(),
          },
        },
        {
          provide: CompaniesService,
          useValue: { create: jest.fn(), findById: jest.fn() },
        },
        {
          provide: JwtService,
          useValue: { signAsync: jest.fn(), verifyAsync: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => `mock-${key}`) },
        },
      ],
    }).compile();

    service = module.get(AuthService);
    usersService = module.get(UsersService);
    companiesService = module.get(CompaniesService);
    jwtService = module.get(JwtService);
    jwtService.signAsync.mockResolvedValue('signed-token');
  });

  describe('register', () => {
    it('registers a candidate without requiring a company', async () => {
      usersService.create.mockResolvedValue(fakeUser as any);

      const result = await service.register({
        email: fakeUser.email,
        password: 'correct-password',
        firstName: 'Ada',
        lastName: 'Lovelace',
      });

      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: Role.CANDIDATE, companyId: null }),
      );
      expect(result.accessToken).toBe('signed-token');
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('rejects admin registration without a companyName', async () => {
      await expect(
        service.register({
          email: 'admin@example.com',
          password: 'x',
          firstName: 'A',
          lastName: 'B',
          role: Role.ADMIN,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects recruiter registration without a companyId', async () => {
      await expect(
        service.register({
          email: 'recruiter@example.com',
          password: 'x',
          firstName: 'A',
          lastName: 'B',
          role: Role.RECRUITER,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a company when registering as admin with companyName', async () => {
      companiesService.create.mockResolvedValue({ id: 'company-1' } as any);
      usersService.create.mockResolvedValue({
        ...fakeUser,
        role: Role.ADMIN,
      } as any);

      await service.register({
        email: 'admin@example.com',
        password: 'x',
        firstName: 'A',
        lastName: 'B',
        role: Role.ADMIN,
        companyName: 'Acme SME',
      });

      expect(companiesService.create).toHaveBeenCalledWith('Acme SME');
      expect(usersService.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 'company-1' }),
      );
    });
  });

  describe('login', () => {
    it('logs in with the correct password', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser as any);

      const result = await service.login({
        email: fakeUser.email,
        password: 'correct-password',
      });

      expect(result.accessToken).toBe('signed-token');
    });

    it('rejects an unknown email', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(
        service.login({ email: 'nobody@example.com', password: 'x' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('rejects the wrong password', async () => {
      usersService.findByEmail.mockResolvedValue(fakeUser as any);

      await expect(
        service.login({ email: fakeUser.email, password: 'wrong-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refresh', () => {
    it('rejects a refresh token that fails verification', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

      await expect(service.refresh('garbage')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a refresh token for a user with no stored hash (logged out)', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: fakeUser.id } as any);
      usersService.findById.mockResolvedValue({
        ...fakeUser,
        refreshTokenHash: null,
      } as any);

      await expect(service.refresh('some-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects a refresh token that does not match the stored hash', async () => {
      const storedHash = await bcrypt.hash('a-different-refresh-token', 10);
      jwtService.verifyAsync.mockResolvedValue({ sub: fakeUser.id } as any);
      usersService.findById.mockResolvedValue({
        ...fakeUser,
        refreshTokenHash: storedHash,
      } as any);

      await expect(service.refresh('presented-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
