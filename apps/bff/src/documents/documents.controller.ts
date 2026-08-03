import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';
import 'multer';
import { DocumentsService } from './documents.service';

@Controller('api/documentos')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post('cargar')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: Express.Multer.File) {
    console.log(`Archivo recibido: ${file.originalname}`);
    return this.documentsService.process(file);
  }
}
