import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { readFile, unlink } from 'fs/promises';
import { PDFParse } from 'pdf-parse';
import { Cv } from './cv.entity';
import { ApplicationsService } from '../applications/applications.service';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/user.entity';

const UNIQUE_VIOLATION = '23505';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    @InjectRepository(Cv)
    private cvRepo: Repository<Cv>,
    private applicationsService: ApplicationsService,
  ) {}

  async upload(
    applicationId: string,
    file: Express.Multer.File,
    candidate: User,
  ): Promise<Cv> {
    // Throws 404 if this isn't the candidate's own application — same
    // authorization ApplicationsController already enforces on GET.
    const application = await this.applicationsService.findOne(
      applicationId,
      candidate,
    );
    if (application.candidateId !== candidate.id) {
      throw new ForbiddenException('You can only upload a CV to your own application');
    }

    // Extraction failure (encrypted PDF, scanned image with no text layer,
    // corrupt file) does not block the upload — spec's fallback behaviour
    // for AI Feature 2 is "CV is stored and recruiter reviews it manually
    // with no AI scoring", which requires the file to exist even without text.
    let extractedText: string | null = null;
    try {
      extractedText = await this.extractText(file.path);
    } catch (err) {
      this.logger.warn(
        `PDF text extraction failed for application ${applicationId}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }

    const cv = this.cvRepo.create({
      applicationId,
      originalFilename: file.originalname,
      storagePath: file.path,
      fileSizeBytes: file.size,
      extractedText,
    });

    try {
      return await this.cvRepo.save(cv);
    } catch (err) {
      // Application.cv is a OneToOne — a second upload attempt hits the
      // unique constraint on applicationId. Clean up the just-written file
      // on disk before surfacing the error, so we don't leak orphaned files.
      await unlink(file.path).catch(() => undefined);
      if (
        err instanceof QueryFailedError &&
        (err as any).driverError?.code === UNIQUE_VIOLATION
      ) {
        throw new BadRequestException(
          'A CV has already been uploaded for this application',
        );
      }
      throw err;
    }
  }

  async findOne(id: string, user: User): Promise<Cv> {
    const cv = await this.cvRepo.findOne({ where: { id } });
    if (!cv) throw new NotFoundException('CV not found');

    // Reuses the same authorization as the owning application: candidate
    // must own it, staff must belong to the posting's company.
    await this.applicationsService.findOne(cv.applicationId, user);
    return cv;
  }

  async getFilePath(id: string, user: User): Promise<{ path: string; filename: string }> {
    const cv = await this.findOne(id, user);
    return { path: cv.storagePath, filename: cv.originalFilename };
  }

  private async extractText(filePath: string): Promise<string | null> {
    const buffer = await readFile(filePath);
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText({ pageJoiner: '' });
      const text = result.text?.trim();
      return text && text.length > 0 ? text : null;
    } finally {
      await parser.destroy();
    }
  }
}
