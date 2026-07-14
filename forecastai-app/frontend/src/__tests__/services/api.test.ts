import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api.service';

describe('API Service', () => {
  it('has correct base URL', () => {
    expect(api.defaults.baseURL).toBe('/api');
  });

  it('has correct timeout', () => {
    expect(api.defaults.timeout).toBe(120000);
  });
});
