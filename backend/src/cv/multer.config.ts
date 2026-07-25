import { BadRequestException } from '@nestjs/common';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

export const CV_UPLOAD_DIR = './uploads/cvs';
export const CV_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, per spec 3.4

// Extension check backs up the mimetype check — a renamed .exe can claim
// "application/pdf" as its mimetype, but can't fake a .pdf extension without
// also matching this filter, so both must agree.
function pdfFileFilter(
  _req: Request,
  file: Express.Multer.File,
  callback: (error: Error | null, acceptFile: boolean) => void,
) {
  const isPdfMime = file.mimetype === 'application/pdf';
  const isPdfExt = extname(file.originalname).toLowerCase() === '.pdf';
  if (!isPdfMime || !isPdfExt) {
    return callback(
      new BadRequestException('Only PDF files are accepted for CV upload'),
      false,
    );
  }
  callback(null, true);
}

export const cvMulterOptions = {
  storage: diskStorage({
    destination: CV_UPLOAD_DIR,
    // UUID filename avoids path traversal / collisions; original extension
    // kept so files remain human-inspectable on disk during debugging.
    filename: (_req, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  fileFilter: pdfFileFilter,
  limits: { fileSize: CV_MAX_SIZE_BYTES },
};
