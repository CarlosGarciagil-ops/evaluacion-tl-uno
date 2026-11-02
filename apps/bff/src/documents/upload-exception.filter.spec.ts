import { ArgumentsHost, HttpStatus } from '@nestjs/common';
import { MulterError } from 'multer';
import { UploadExceptionFilter } from './upload-exception.filter';

describe('UploadExceptionFilter', () => {
  it('convierte el límite de Multer en un 413 JSON', () => {
    const json = jest.fn();
    const setHeader = jest.fn();
    const status = jest.fn(() => ({ json }));
    const host = {
      switchToHttp: () => ({
        getRequest: () => ({ headers: { 'x-request-id': 'corr-multer' } }),
        getResponse: () => ({ status, setHeader }),
      }),
    } as unknown as ArgumentsHost;

    new UploadExceptionFilter().catch(
      new MulterError('LIMIT_FILE_SIZE'),
      host,
    );

    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'corr-multer');
    expect(status).toHaveBeenCalledWith(HttpStatus.PAYLOAD_TOO_LARGE);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 413 }),
    );
  });
});
