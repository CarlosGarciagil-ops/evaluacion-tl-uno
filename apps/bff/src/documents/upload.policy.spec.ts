import { HttpException } from '@nestjs/common';
import type { Express } from 'express';
import {
  FILE_REQUIRED_MESSAGE,
  FILE_TOO_LARGE_MESSAGE,
  MAX_UPLOAD_BYTES,
  PDF_ONLY_MESSAGE,
  assertUploadable,
  resolveCorrelationId,
} from './upload.policy';

function pdfFile(
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File {
  const buffer = Buffer.from('%PDF-1.4\n');
  return {
    fieldname: 'file',
    originalname: 'secreto.pdf',
    encoding: '7bit',
    mimetype: 'application/pdf',
    size: buffer.length,
    buffer,
    stream: undefined as never,
    destination: '',
    filename: '',
    path: '',
    ...overrides,
  };
}

function thrown(run: () => void): HttpException {
  try {
    run();
  } catch (error) {
    if (error instanceof HttpException) {
      return error;
    }
    throw error;
  }
  throw new Error('se esperaba un HttpException');
}

describe('assertUploadable', () => {
  it('acepta un PDF dentro del límite', () => {
    expect(() => assertUploadable(pdfFile())).not.toThrow();
  });

  it('rechaza la carga sin archivo', () => {
    const error = thrown(() => assertUploadable(undefined));
    expect(error.getStatus()).toBe(400);
    expect(error.message).toBe(FILE_REQUIRED_MESSAGE);
  });

  it('rechaza un tipo distinto de PDF', () => {
    const error = thrown(() =>
      assertUploadable(
        pdfFile({
          mimetype: 'text/plain',
          buffer: Buffer.from('hola'),
          size: 4,
        }),
      ),
    );
    expect(error.getStatus()).toBe(415);
    expect(error.message).toBe(PDF_ONLY_MESSAGE);
  });

  it('rechaza un archivo que declara PDF y no empieza con %PDF', () => {
    const error = thrown(() =>
      assertUploadable(
        pdfFile({
          buffer: Buffer.from('no es un pdf'),
          size: 12,
        }),
      ),
    );
    expect(error.getStatus()).toBe(415);
  });

  it('rechaza un archivo de más de 5 MB', () => {
    const error = thrown(() =>
      assertUploadable(pdfFile({ size: MAX_UPLOAD_BYTES + 1 })),
    );
    expect(error.getStatus()).toBe(413);
    expect(error.message).toBe(FILE_TOO_LARGE_MESSAGE);
  });
});

describe('resolveCorrelationId', () => {
  it('conserva un identificador seguro', () => {
    expect(resolveCorrelationId('carga-42')).toBe('carga-42');
  });

  it('genera otro identificador cuando el header no es seguro', () => {
    expect(resolveCorrelationId('id con espacio')).not.toBe('id con espacio');
    expect(resolveCorrelationId(undefined)).toEqual(expect.any(String));
  });
});
