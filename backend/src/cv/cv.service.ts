import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { readFile, unlink } from 'fs/promises';
import { basename } from 'path';
import { PDFParse } from 'pdf-parse';
import { Cv, CvDocument } from './cv.entity';
import { ApplicationsService } from '../applications/applications.service';
import { User } from '../users/user.entity';

@Injectable()
export class CvService {
  private readonly logger = new Logger(CvService.name);

  constructor(
    @InjectModel(Cv.name)
    private cvModel: Model<CvDocument>,
    private applicationsService: ApplicationsService,
  ) {}

  async upload(
    applicationId: string,
    file: Express.Multer.File,
    candidate: User,
  ): Promise<Cv> {
    const application = await this.applicationsService.findOne(
      applicationId,
      candidate,
    );
    if (application.candidateId !== candidate.id) {
      throw new ForbiddenException(
        'You can only upload a CV to your own application',
      );
    }

    // Validate PDF magic bytes (%PDF-) to prevent malicious non-PDF uploads
    const buffer = await readFile(file.path);
    if (
      !buffer ||
      buffer.length < 5 ||
      buffer.subarray(0, 5).toString('ascii') !== '%PDF-'
    ) {
      await unlink(file.path).catch(() => undefined);
      throw new BadRequestException(
        'Uploaded file is not a valid PDF document (invalid magic bytes)',
      );
    }

    // Sanitize filename to prevent path traversal or control character injection
    const sanitizedFilename = basename(file.originalname).replace(/[\r\n\0]/g, '');

    let extractedText: string | null = null;
    try {
      extractedText = await this.extractTextFromBuffer(buffer);
    } catch (err) {
      this.logger.warn(
        `PDF text extraction failed for application ${applicationId}: ${
          err instanceof Error ? err.message : err
        }`,
      );
    }

    try {
      const cv = await this.cvModel.create({
        applicationId,
        originalFilename: sanitizedFilename,
        storagePath: file.path,
        fileSizeBytes: file.size,
        extractedText,
        uploadedAt: new Date(),
      });
      return cv.toObject();
    } catch (err: any) {
      await unlink(file.path).catch(() => undefined);
      if (err.code === 11000) {
        throw new BadRequestException(
          'A CV has already been uploaded for this application',
        );
      }
      throw err;
    }
  }

  async findOne(id: string, user: User): Promise<Cv> {
    const cv = await this.cvModel.findById(id).exec();
    if (!cv) throw new NotFoundException('CV not found');

    await this.applicationsService.findOne(cv.applicationId, user);
    return cv;
  }

  async getFilePath(
    id: string,
    user: User,
  ): Promise<{ path: string; filename: string }> {
    const cv = await this.findOne(id, user);
    return { path: cv.storagePath, filename: cv.originalFilename };
  }

  private async extractTextFromBuffer(buffer: Buffer): Promise<string | null> {
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
