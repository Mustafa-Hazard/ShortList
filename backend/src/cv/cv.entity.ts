import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Application } from '../applications/application.entity';

@Entity('cvs')
export class Cv {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Application, (application) => application.cv, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'applicationId' })
  application: Application;

  @Column()
  applicationId: string;

  @Column()
  originalFilename: string;

  // Path on disk (or object storage key) — never exposed directly to other
  // roles without going through an authorised download endpoint.
  @Column()
  storagePath: string;

  @Column({ type: 'int' })
  fileSizeBytes: number;

  // Server-side extracted text, produced once at upload time and reused by
  // every AI feature (scorer, question suggester) so we never re-parse.
  @Column({ type: 'text', nullable: true })
  extractedText: string | null;

  @CreateDateColumn()
  uploadedAt: Date;
}
