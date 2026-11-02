import {
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { Express } from 'express';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const UPSTREAM_TIMEOUT_MS = 5_000;

export const FILE_REQUIRED_MESSAGE = 'El campo file es obligatorio';
export const FILE_TOO_LARGE_MESSAGE = 'El archivo supera el máximo de 5 MB';
export const PDF_ONLY_MESSAGE = 'Solo se aceptan archivos PDF';
export const UPSTREAM_TIMEOUT_MESSAGE =
  'El servicio de documentos no respondió a tiempo';
export const UPSTREAM_ERROR_MESSAGE =
  'El servicio de documentos no pudo procesar el archivo';

const PDF_MAGIC = '%PDF';
const REQUEST_ID_PATTERN = /^[A-Za-z0-9-]{1,128}$/;

export function resolveCorrelationId(
  header: string | string[] | undefined,
): string {
  const value = Array.isArray(header) ? header[0] : header;
  if (value && REQUEST_ID_PATTERN.test(value)) {
    return value;
  }
  return randomUUID();
}

export function assertUploadable(file: Express.Multer.File | undefined): void {
  if (!file) {
    throw new BadRequestException(FILE_REQUIRED_MESSAGE);
  }

  const byteLength = file.buffer?.length ?? 0;
  if (file.size > MAX_UPLOAD_BYTES || byteLength > MAX_UPLOAD_BYTES) {
    throw new PayloadTooLargeException(FILE_TOO_LARGE_MESSAGE);
  }

  const header = file.buffer?.subarray(0, PDF_MAGIC.length).toString('utf8');
  if (file.mimetype !== 'application/pdf' || header !== PDF_MAGIC) {
    throw new UnsupportedMediaTypeException(PDF_ONLY_MESSAGE);
  }
}
