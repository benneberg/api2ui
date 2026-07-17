import { describe, it, expect } from 'vitest';
import { mockDataService } from './mockDataService';

describe('mockDataService', () => {
  it('should generate simple mock values from string schema', () => {
    const schema = { type: 'string', format: 'email' };
    const value = mockDataService.generateFromSchema(schema);
    expect(value).toBeTypeOf('string');
    expect(value).toContain('@');
  });

  it('should generate simple mock values from number schema', () => {
    const schema = { type: 'number' };
    const value = mockDataService.generateFromSchema(schema);
    expect(value).toBeTypeOf('number');
  });

  it('should resolve anyOf constraints correctly', () => {
    const schema = {
      anyOf: [
        { type: 'string', format: 'uuid' },
        { type: 'string', format: 'email' }
      ]
    };
    const value = mockDataService.generateFromSchema(schema);
    expect(value).toBeTypeOf('string');
  });

  it('should resolve oneOf constraints correctly', () => {
    const schema = {
      oneOf: [
        { type: 'number' },
        { type: 'boolean' }
      ]
    };
    const value = mockDataService.generateFromSchema(schema);
    expect(['number', 'boolean']).toContain(typeof value);
  });
});
