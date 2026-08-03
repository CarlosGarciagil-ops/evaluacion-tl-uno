import { Injectable } from '@nestjs/common';
import axios from 'axios';
import type { Express } from 'express';
import 'multer';

@Injectable()
export class DocumentsService {
  private readonly baseUrl =
    process.env.DOCUMENT_SERVICE_URL ?? 'http://localhost:8080';

  async process(file: Express.Multer.File) {
    const response = await axios.post(
      `${this.baseUrl}/internal/documentos/procesar`,
      {
        filename: file.originalname,
        size: file.size,
        contentType: file.mimetype,
      },
    );

    return response.data;
  }
}
