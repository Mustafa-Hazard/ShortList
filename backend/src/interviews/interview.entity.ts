import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from '../applications/application.entity';
import { User } from '../users/user.entity';
import { InterviewStatus, InterviewType } from '../common/enums/interview.enum';

interface SuggestedQuestion {
  question: string;
  listenFor: string;
}

@Entity('interviews')
export class Interview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Application, (application) => application.interviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'applicationId' })
  application: Application;

  @Column()
  applicationId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'proposedById' })
  proposedBy: User | null;

  @Column({ nullable: true })
  proposedById: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'hiringManagerId' })
  hiringManager: User | null;

  @Column({ nullable: true })
  hiringManagerId: string | null;

  @Column({ type: 'enum', enum: InterviewType })
  type: InterviewType;

  // Recruiter-proposed slots; candidate confirms one of these.
  @Column({ type: 'timestamptz', array: true, default: [] })
  proposedSlots: Date[];

  @Column({ type: 'timestamptz', nullable: true })
  confirmedSlot: Date | null;

  @Column({ type: 'enum', enum: InterviewStatus, default: InterviewStatus.PROPOSED })
  status: InterviewStatus;

  // --- AI Feature 3: Interview Question Suggester output. Hiring manager can
  // add/remove/reorder before the interview — the final array is what's saved. ---
  @Column({ type: 'jsonb', default: [] })
  questions: SuggestedQuestion[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
