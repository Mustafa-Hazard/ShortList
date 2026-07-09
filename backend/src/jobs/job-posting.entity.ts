import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';
import { Application } from '../applications/application.entity';
import { JobStatus, JobType } from '../common/enums/job.enum';

@Entity('job_postings')
export class JobPosting {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Company, (company) => company.jobPostings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column()
  companyId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @Column({ nullable: true })
  createdById: string | null;

  @Column()
  title: string;

  @Column()
  department: string;

  @Column({ type: 'enum', enum: JobType })
  type: JobType;

  @Column({ type: 'int', nullable: true })
  salaryMin: number | null;

  @Column({ type: 'int', nullable: true })
  salaryMax: number | null;

  @Column({ type: 'text', array: true, default: [] })
  requiredSkills: string[];

  @Column({ type: 'text' })
  responsibilities: string;

  @Column({ type: 'text', nullable: true })
  cultureNotes: string | null;

  // Full AI-generated (or manually written) job description body.
  // Kept separate from the structured fields above so the AI generator
  // can regenerate it without clobbering the structured requirements.
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.DRAFT })
  status: JobStatus;

  @OneToMany(() => Application, (application) => application.jobPosting)
  applications: Application[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
