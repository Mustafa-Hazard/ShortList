import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

export enum NotificationType {
  APPLICATION_STAGE_CHANGED = 'application_stage_changed',
  INTERVIEW_PROPOSED = 'interview_proposed',
  INTERVIEW_CONFIRMED = 'interview_confirmed',
  INTERVIEW_REMINDER = 'interview_reminder',
  OFFER_ISSUED = 'offer_issued',
  OFFER_RESPONDED = 'offer_responded',
}

// Persisted so a user who is offline when a WebSocket event fires can still
// see it on next login — the gateway both emits live and writes one of these.
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({ default: false })
  read: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
