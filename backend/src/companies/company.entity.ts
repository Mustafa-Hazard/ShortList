import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { JobPosting } from '../jobs/job-posting.entity';

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  // Free-form company settings (branding, notification preferences, etc.)
  @Column({ type: 'jsonb', default: {} })
  settings: Record<string, unknown>;

  @OneToMany(() => User, (user) => user.company)
  users: User[];

  @OneToMany(() => JobPosting, (job) => job.company)
  jobPostings: JobPosting[];

  @CreateDateColumn()
  createdAt: Date;
}
