import {
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
} from '@nestjs/common';
import axios from 'axios';
import type { Express } from 'express';
import {
  UPSTREAM_ERROR_MESSAGE,
  UPSTREAM_TIMEOUT_MESSAGE,
  UPSTREAM_TIMEOUT_MS,
  assertUploadable,
} from './upload.policy';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);
  private readonly baseUrl =
    process.env.DOCUMENT_SERVICE_URL ?? 'http://localhost:8080';

  async process(file: Express.Multer.File | undefined, correlationId: string) {
    assertUploadable(file);
    const upload = file as Express.Multer.File;

    try {
      const response = await axios.post(
        `${this.baseUrl}/internal/documentos/procesar`,
        {
          filename: upload.originalname,
          size: upload.size,
          contentType: upload.mimetype,
        },
        {
          timeout: UPSTREAM_TIMEOUT_MS,
          headers: { 'x-request-id': correlationId },
        },
      );

      this.logger.log(
        `procesar id=${correlationId} bytes=${upload.size} resultado=aceptado`,
      );
      return response.data;
    } catch (error) {
      if (isTimeout(error)) {
        this.logger.warn(
          `procesar id=${correlationId} bytes=${upload.size} resultado=timeout`,
        );
        throw new GatewayTimeoutException(UPSTREAM_TIMEOUT_MESSAGE);
      }

      const status = upstreamStatus(error);
      this.logger.warn(
        `procesar id=${correlationId} bytes=${upload.size} resultado=error-upstream status=${status ?? 'sin-respuesta'}`,
      );
      throw new BadGatewayException(UPSTREAM_ERROR_MESSAGE);
    }
  }
}

function isTimeout(error: unknown): boolean {
  if (!axios.isAxiosError(error)) {
    return false;
  }
  return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
}

function upstreamStatus(error: unknown): number | undefined {
  if (!axios.isAxiosError(error)) {
    return undefined;
  }
  return error.response?.status;
}
