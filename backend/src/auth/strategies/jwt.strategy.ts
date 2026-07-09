import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { JwtPayload } from '../jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  // Runs on every authenticated request. Re-fetching the user (rather than
  // trusting the payload blindly) means a role change or deactivation takes
  // effect immediately instead of waiting for the token to expire.
  async validate(payload: JwtPayload): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: payload.sub });
    if (!user) throw new UnauthorizedException('User no longer exists');
    return user;
  }
}
