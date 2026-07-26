import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvService } from './cv.service';

describe('CvController', () => {
  let controller: CvController;
  let cvService: any;

  const mockUser = { id: 'user-1', role: 'candidate', companyId: 'comp-1' };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CvController],
      providers: [
        {
          provide: CvService,
          useValue: {
            upload: jest.fn(),
            findOne: jest.fn(),
            getFilePath: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<CvController>(CvController);
    cvService = module.get<CvService>(CvService);
  });

  it('upload throws synchronously when no file is present on the request', () => {
    expect(() =>
      controller.upload('app-1', undefined as any, mockUser as any),
    ).toThrow(NotFoundException);
  });

  it('delegates to cvService.upload when file is present', async () => {
    const mockFile = { path: 'test.pdf' } as Express.Multer.File;
    cvService.upload.mockResolvedValue({ id: 'cv-1' });

    const result = await controller.upload('app-1', mockFile, mockUser as any);
    expect(result).toEqual({ id: 'cv-1' });
    expect(cvService.upload).toHaveBeenCalledWith('app-1', mockFile, mockUser);
  });

  it('delegates to cvService.findOne on findOne', async () => {
    cvService.findOne.mockResolvedValue({ id: 'cv-1' });

    const result = await controller.findOne('cv-1', mockUser as any);
    expect(result).toEqual({ id: 'cv-1' });
    expect(cvService.findOne).toHaveBeenCalledWith('cv-1', mockUser);
  });

  it('delegates to cvService.getFilePath and calls res.download on download', async () => {
    const mockRes = { download: jest.fn() } as any;
    cvService.getFilePath.mockResolvedValue({
      path: 'uploads/test.pdf',
      filename: 'resume.pdf',
    });

    await controller.download('cv-1', mockUser as any, mockRes);
    expect(cvService.getFilePath).toHaveBeenCalledWith('cv-1', mockUser);
    expect(mockRes.download).toHaveBeenCalledWith(
      'uploads/test.pdf',
      'resume.pdf',
    );
  });
});
