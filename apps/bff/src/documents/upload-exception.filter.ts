import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';
import { FILE_TOO_LARGE_MESSAGE, resolveCorrelationId } from './upload.policy';

@Catch(MulterError)
export class UploadExceptionFilter implements ExceptionFilter {
  catch(exception: MulterError, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<{ headers: Record<string, string | string[] | undefined> }>();
    const response = http.getResponse<{
      setHeader: (name: string, value: string) => void;
      status: (code: number) => { json: (body: unknown) => void };
    }>();

    response.setHeader(
      'x-request-id',
      resolveCorrelationId(request.headers['x-request-id']),
    );

    if (exception.code === 'LIMIT_FILE_SIZE') {
      response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
        statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
        message: FILE_TOO_LARGE_MESSAGE,
        error: 'Payload Too Large',
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: 'No se pudo leer el archivo',
      error: 'Bad Request',
    });
  }
}
