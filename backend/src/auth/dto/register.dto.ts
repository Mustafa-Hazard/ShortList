import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Role } from '../../common/enums/role.enum';

export class RegisterDto {
  @ApiProperty({ example: 'candidate@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  // Candidates self-register with no companyId. Staff roles (recruiter,
  // hiring_manager, admin) must supply a valid companyId — enforced in
  // AuthService.register(), not just here, since DTO validation alone can't
  // express "required if role is X".
  @ApiPropertyOptional({ enum: Role, default: Role.CANDIDATE })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Required when role is not candidate' })
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @ApiPropertyOptional({
    description: 'Required when role is admin — creates a new company owned by this admin',
  })
  @IsOptional()
  @IsString()
  companyName?: string;
}
