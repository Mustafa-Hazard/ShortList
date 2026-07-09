import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { Role } from '../common/enums/role.enum';
import { Company } from '../companies/company.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  email: string;

  @Exclude()
  @Column()
  passwordHash: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: Role, default: Role.CANDIDATE })
  role: Role;

  // Candidates don't belong to a company. Recruiters, hiring managers and
  // admins are scoped to the company they work for.
  @ManyToOne(() => Company, (company) => company.users, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company: Company | null;

  @Column({ nullable: true })
  companyId: string | null;

  // Hash of the currently-valid refresh token (bcrypt), so refresh tokens
  // can be revoked (logout, password change) instead of being valid until
  // expiry no matter what. Never serialised to the client.
  @Exclude()
  @Column({ nullable: true })
  refreshTokenHash: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
