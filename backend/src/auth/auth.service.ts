import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CompaniesService } from '../companies/companies.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';
import { JwtPayload } from './jwt-payload.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private companiesService: CompaniesService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: Partial<User> } & AuthTokens> {
    const role = dto.role ?? Role.CANDIDATE;
    let companyId: string | null = null;

    if (role === Role.ADMIN) {
      if (!dto.companyName) {
        throw new BadRequestException('companyName is required to register as admin');
      }
      const company = await this.companiesService.create(dto.companyName);
      companyId = company.id;
    } else if (role === Role.RECRUITER || role === Role.HIRING_MANAGER) {
      if (!dto.companyId) {
        throw new BadRequestException(`companyId is required to register as ${role}`);
      }
      // Throws NotFoundException if the company doesn't exist.
      await this.companiesService.findById(dto.companyId);
      companyId = dto.companyId;
    }

    const user = await this.usersService.create({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role,
      companyId,
    });

    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  async login(dto: LoginDto): Promise<{ user: Partial<User> } & AuthTokens> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const tokens = await this.issueTokens(user);
    return { user: this.sanitize(user), ...tokens };
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user?.refreshTokenHash) throw new UnauthorizedException('Session revoked');

    const matches = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!matches) throw new UnauthorizedException('Session revoked');

    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.setRefreshTokenHash(userId, null);
  }

  private async issueTokens(user: User): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN'),
      }),
    ]);

    // Only the hash is stored — a leaked DB doesn't hand out usable tokens.
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.usersService.setRefreshTokenHash(user.id, refreshTokenHash);

    return { accessToken, refreshToken };
  }

  private sanitize(user: User): Partial<User> {
    const { passwordHash, refreshTokenHash, ...rest } = user;
    return rest;
  }
}
