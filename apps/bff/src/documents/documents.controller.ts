import {
  Controller,
  Headers,
  HttpException,
  Logger,
  Post,
  Res,
  UploadedFile,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import type { Express } from 'express';
import 'multer';
import { DocumentsService } from './documents.service';
import { UploadExceptionFilter } from './upload-exception.filter';
import { MAX_UPLOAD_BYTES, resolveCorrelationId } from './upload.policy';

@Controller('api/documentos')
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Post('cargar')
  @UseFilters(UploadExceptionFilter)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES } }),
  )
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-request-id') requestId: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const correlationId = resolveCorrelationId(requestId);
    response.setHeader('x-request-id', correlationId);
    this.logger.log(
      `carga id=${correlationId} bytes=${file?.size ?? 0} resultado=recibida`,
    );
    try {
      return await this.documentsService.process(file, correlationId);
    } catch (error) {
      const status = error instanceof HttpException ? error.getStatus() : 500;
      this.logger.warn(
        `carga id=${correlationId} bytes=${file?.size ?? 0} resultado=rechazada status=${status}`,
      );
      throw error;
    }
  }
}
