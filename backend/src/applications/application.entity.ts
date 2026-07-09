import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { JobPosting } from '../jobs/job-posting.entity';
import { Cv } from '../cv/cv.entity';
import { Interview } from '../interviews/interview.entity';
import { Offer } from '../offers/offer.entity';
import { ApplicationStage } from '../common/enums/application-stage.enum';

@Entity('applications')
@Index(['jobPostingId', 'candidateId'], { unique: true })
export class Application {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => JobPosting, (job) => job.applications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'jobPostingId' })
  jobPosting: JobPosting;

  @Column()
  jobPostingId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'candidateId' })
  candidate: User;

  @Column()
  candidateId: string;

  @Column({ type: 'text', nullable: true })
  coverLetter: string | null;

  @Column({ type: 'float', nullable: true })
  yearsOfExperience: number | null;

  @Column({ type: 'int', nullable: true })
  salaryExpectation: number | null;

  @Column({ type: 'date', nullable: true })
  availabilityDate: string | null;

  @Column({
    type: 'enum',
    enum: ApplicationStage,
    default: ApplicationStage.APPLIED,
  })
  stage: ApplicationStage;

  @OneToOne(() => Cv, (cv) => cv.application)
  cv: Cv;

  // --- AI Feature 2: CV Screening & Scorer output, cached on the application
  // so the shortlist can sort by score without re-calling the AI each time. ---
  @Column({ type: 'int', nullable: true })
  aiScore: number | null;

  @Column({ type: 'jsonb', nullable: true })
  aiExtraction: {
    name?: string;
    yearsOfExperience?: number;
    topSkills?: string[];
    educationLevel?: string;
    lastRole?: string;
  } | null;

  @Column({ type: 'text', array: true, nullable: true })
  aiStrengths: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  aiGaps: string[] | null;

  @OneToMany(() => Interview, (interview) => interview.application)
  interviews: Interview[];

  @OneToOne(() => Offer, (offer) => offer.application)
  offer: Offer;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
