import { HttpException, Logger } from '@nestjs/common';
import axios from 'axios';
import type { Express } from 'express';
import { DocumentsService } from './documents.service';
import { MAX_UPLOAD_BYTES } from './upload.policy';

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

describe('DocumentsService', () => {
  const service = new DocumentsService();

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('envía el archivo al servicio Java con timeout y correlation id', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({
      data: { status: 'ACCEPTED', documentId: 'doc-1' },
    });

    const result = await service.process(pdfFile(), 'corr-1');

    expect(result).toEqual({ status: 'ACCEPTED', documentId: 'doc-1' });
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/internal/documentos/procesar'),
      expect.objectContaining({
        filename: 'secreto.pdf',
        contentType: 'application/pdf',
      }),
      expect.objectContaining({
        timeout: 5_000,
        headers: { 'x-request-id': 'corr-1' },
      }),
    );
  });

  it('no llama al Java cuando el archivo no es PDF', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await expect(
      service.process(
        pdfFile({ mimetype: 'text/plain', buffer: Buffer.from('hola'), size: 4 }),
        'corr-2',
      ),
    ).rejects.toBeInstanceOf(HttpException);

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('responde 413 cuando el archivo supera 5 MB', async () => {
    jest.spyOn(axios, 'post').mockResolvedValue({ data: {} });

    await expect(
      service.process(pdfFile({ size: MAX_UPLOAD_BYTES + 1 }), 'corr-3'),
    ).rejects.toMatchObject({ status: 413 });

    expect(axios.post).not.toHaveBeenCalled();
  });

  it('responde 504 cuando el Java no contesta a tiempo', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue({
      isAxiosError: true,
      code: 'ECONNABORTED',
    });

    await expect(service.process(pdfFile(), 'corr-4')).rejects.toMatchObject({
      status: 504,
    });
  });

  it('responde 502 cuando el Java no está disponible', async () => {
    jest.spyOn(axios, 'post').mockRejectedValue({
      isAxiosError: true,
      code: 'ECONNREFUSED',
    });

    await expect(service.process(pdfFile(), 'corr-5')).rejects.toMatchObject({
      status: 502,
    });
  });

  it('no escribe el nombre del archivo en el log', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation(() => undefined);
    jest.spyOn(axios, 'post').mockResolvedValue({ data: { status: 'ACCEPTED' } });

    await service.process(pdfFile(), 'corr-6');

    const written = log.mock.calls.map((call) => String(call[0])).join(' ');
    expect(written).toContain('id=corr-6');
    expect(written).not.toContain('secreto.pdf');
  });
});
