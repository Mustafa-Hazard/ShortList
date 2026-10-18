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

    try {
      const cv = await this.cvModel.create({
        applicationId,
        originalFilename: file.originalname,
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
