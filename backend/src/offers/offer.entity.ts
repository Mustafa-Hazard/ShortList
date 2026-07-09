import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Application } from '../applications/application.entity';
import { User } from '../users/user.entity';
import { OfferStatus } from '../common/enums/offer-status.enum';

@Entity('offers')
export class Offer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Application, (application) => application.offer, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'applicationId' })
  application: Application;

  @Column()
  applicationId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'issuedById' })
  issuedBy: User | null;

  @Column({ nullable: true })
  issuedById: string | null;

  @Column()
  roleTitle: string;

  @Column({ type: 'int' })
  salary: number;

  @Column({ type: 'date' })
  startDate: string;

  @Column({ type: 'text' })
  benefitsSummary: string;

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.ISSUED })
  status: OfferStatus;

  // Free-text counter-offer from the candidate, if they negotiate.
  @Column({ type: 'text', nullable: true })
  candidateResponse: string | null;

  // AI Feature 4 (bonus): the drafted letter body, reviewed and approved by
  // the recruiter before it's ever surfaced to the candidate.
  @Column({ type: 'text', nullable: true })
  draftedLetter: string | null;

  @Column({ default: false })
  letterApproved: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
