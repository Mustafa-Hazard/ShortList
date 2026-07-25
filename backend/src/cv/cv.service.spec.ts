import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { CvService } from './cv.service';
import { Cv } from './cv.entity';
import { ApplicationsService } from '../applications/applications.service';
import { readFile, unlink } from 'fs/promises';

jest.mock('fs/promises', () => ({
  readFile: jest.fn(),
  unlink: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('pdf-parse', () => {
  return {
    PDFParse: jest.fn().mockImplementation(() => ({
      getText: jest.fn().mockResolvedValue({ text: 'Extracted CV text' }),
      destroy: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

describe('CvService', () => {
  let service: CvService;
  let cvRepo: any;
  let applicationsService: any;

  const mockCandidate = { id: 'cand-1', companyId: 'comp-1', role: 'candidate' };
  const mockApplication = { id: 'app-1', candidateId: 'cand-1', jobPosting: { companyId: 'comp-1' } };
  const mockCv = {
    id: 'cv-1',
    applicationId: 'app-1',
    storagePath: 'uploads/cvs/test.pdf',
    originalFilename: 'resume.pdf',
    fileSizeBytes: 1024,
    extractedText: 'Extracted CV text',
  };
  const mockFile = {
    path: 'uploads/cvs/test.pdf',
    originalname: 'resume.pdf',
    mimetype: 'application/pdf',
    size: 1024,
  } as Express.Multer.File;

  beforeEach(async () => {
    (readFile as jest.Mock).mockResolvedValue(Buffer.from('fake pdf bytes'));
    (unlink as jest.Mock).mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvService,
        {
          provide: getRepositoryToken(Cv),
          useValue: {
            create: jest.fn((dto) => ({ id: 'cv-1', ...dto })),
            save: jest.fn((entity) => Promise.resolve({ id: 'cv-1', ...entity })),
            findOne: jest.fn(),
          },
        },
        {
          provide: ApplicationsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CvService>(CvService);
    cvRepo = module.get(getRepositoryToken(Cv));
    applicationsService = module.get<ApplicationsService>(ApplicationsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('upload', () => {
    it('successfully uploads and extracts CV text', async () => {
      applicationsService.findOne.mockResolvedValue(mockApplication);

      const result = await service.upload('app-1', mockFile, mockCandidate as any);

      expect(result).toBeDefined();
      expect(cvRepo.save).toHaveBeenCalled();
      expect(readFile).toHaveBeenCalledWith(mockFile.path);
    });

    it('converts a duplicate-CV unique violation into a 400 and cleans up the file', async () => {
      applicationsService.findOne.mockResolvedValue(mockApplication);

      const queryFailedErr = new QueryFailedError('query', [], new Error('duplicate key'));
      (queryFailedErr as any).driverError = { code: '23505' };
      cvRepo.save.mockRejectedValue(queryFailedErr);

      await expect(
        service.upload('app-1', mockFile, mockCandidate as any),
      ).rejects.toThrow(BadRequestException);

      expect(unlink).toHaveBeenCalledWith(mockFile.path);
    });
  });

  describe('findOne', () => {
    it('returns the CV if found and application ownership checks pass', async () => {
      cvRepo.findOne.mockResolvedValue(mockCv);
      applicationsService.findOne.mockResolvedValue(mockApplication);

      const result = await service.findOne('cv-1', mockCandidate as any);
      expect(result).toEqual(mockCv);
      expect(applicationsService.findOne).toHaveBeenCalledWith('app-1', mockCandidate);
    });

    it('throws NotFoundException if CV does not exist', async () => {
      cvRepo.findOne.mockResolvedValue(null);

      await expect(
        service.findOne('cv-1', mockCandidate as any),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getFilePath', () => {
    it('returns path and original filename for download', async () => {
      cvRepo.findOne.mockResolvedValue(mockCv);
      applicationsService.findOne.mockResolvedValue(mockApplication);

      const result = await service.getFilePath('cv-1', mockCandidate as any);
      expect(result).toEqual({ path: mockCv.storagePath, filename: mockCv.originalFilename });
    });
  });
});
