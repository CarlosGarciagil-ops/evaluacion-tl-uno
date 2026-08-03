import { DocumentsService } from './documents.service';

describe('DocumentsService', () => {
  it('puede ser instanciado', () => {
    const service = new DocumentsService();

    expect(service).toBeDefined();
  });
});
