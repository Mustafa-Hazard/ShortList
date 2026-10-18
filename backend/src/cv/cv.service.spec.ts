import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { CvService } from './cv.service';
import { Cv } from './cv.entity';
import { ApplicationsService } from '../applications/applications.service';
import { User } from '../users/user.entity';
import { Role } from '../common/enums/role.enum';
import * as fsPromises from 'fs/promises';

jest.mock('fs/promises', () => ({
  readFile: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.7 mock valid pdf stream')),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('pdf-parse', () => ({
  PDFParse: jest.fn().mockImplementation(() => ({
    getText: jest.fn().mockResolvedValue({
      text: 'Extracted CV Text: Skills: TypeScript, NestJS, React',
    }),
    destroy: jest.fn().mockResolvedValue(undefined),
  })),
}));

describe('CvService', () => {
  let service: CvService;
  let cvModel: any;
  let applicationsService: jest.Mocked<ApplicationsService>;

  const candidate: User = {
    id: 'candidate-1',
    role: Role.CANDIDATE,
    companyId: null,
  } as User;

  const baseApplication = {
    id: 'app-1',
    candidateId: 'candidate-1',
    jobPostingId: 'posting-1',
  };

  const baseCv: Cv = {
    id: 'cv-1',
    applicationId: 'app-1',
    originalFilename: 'resume.pdf',
    storagePath: '/uploads/app-1-resume.pdf',
    fileSizeBytes: 2048,
    extractedText: 'Extracted CV Text: Skills: TypeScript, NestJS, React',
    uploadedAt: new Date(),
  } as unknown as Cv;

  const mockFile = {
    originalname: 'resume.pdf',
    path: '/uploads/app-1-resume.pdf',
    size: 2048,
  } as Express.Multer.File;

  beforeEach(async () => {
    (fsPromises.readFile as jest.Mock).mockResolvedValue(
      Buffer.from('%PDF-1.7 mock valid pdf stream'),
    );

    cvModel = {
      create: jest.fn().mockResolvedValue({
        ...baseCv,
        toObject: () => baseCv,
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(baseCv),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvService,
        {
          provide: getModelToken(Cv.name),
          useValue: cvModel,
        },
        {
          provide: ApplicationsService,
          useValue: { findOne: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CvService>(CvService);
    applicationsService = module.get(ApplicationsService);
  });

  describe('upload', () => {
    it('saves CV metadata and extracts text successfully for valid PDF', async () => {
      applicationsService.findOne.mockResolvedValue(baseApplication as any);

      const result = await service.upload('app-1', mockFile, candidate);

      expect(applicationsService.findOne).toHaveBeenCalledWith(
        'app-1',
        candidate,
      );
      expect(cvModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'app-1',
          originalFilename: 'resume.pdf',
          fileSizeBytes: 2048,
        }),
      );
      expect(result).toBeDefined();
    });

    it('rejects file and unlinks from disk when magic bytes mismatch (%PDF-)', async () => {
      applicationsService.findOne.mockResolvedValue(baseApplication as any);
      (fsPromises.readFile as jest.Mock).mockResolvedValue(
        Buffer.from('MALICIOUS_EXE_PAYLOAD_WITH_PDF_EXTENSION'),
      );

      await expect(
        service.upload('app-1', mockFile, candidate),
      ).rejects.toThrow(
        /Uploaded file is not a valid PDF document \(invalid magic bytes\)/,
      );
      expect(fsPromises.unlink).toHaveBeenCalledWith(mockFile.path);
    });

    it('forbids candidate from uploading CV to someone else application', async () => {
      applicationsService.findOne.mockResolvedValue({
        ...baseApplication,
        candidateId: 'someone-else',
      } as any);

      await expect(
        service.upload('app-1', mockFile, candidate),
      ).rejects.toThrow(ForbiddenException);
    });

    it('rejects duplicate upload if unique constraint is hit', async () => {
      applicationsService.findOne.mockResolvedValue(baseApplication as any);
      cvModel.create.mockRejectedValue({ code: 11000 });

      await expect(
        service.upload('app-1', mockFile, candidate),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne & getFilePath', () => {
    it('returns CV when found and authorized', async () => {
      applicationsService.findOne.mockResolvedValue(baseApplication as any);

      const result = await service.findOne('cv-1', candidate);

      expect(result.id).toBe('cv-1');
      expect(applicationsService.findOne).toHaveBeenCalledWith(
        'app-1',
        candidate,
      );
    });

    it('throws NotFoundException if CV does not exist', async () => {
      cvModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.findOne('missing', candidate)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns file path for authorized download', async () => {
      applicationsService.findOne.mockResolvedValue(baseApplication as any);

      const result = await service.getFilePath('cv-1', candidate);

      expect(result.path).toBe('/uploads/app-1-resume.pdf');
      expect(result.filename).toBe('resume.pdf');
    });
  });
});
