import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

describe('CSP Report API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/csp-report', () => {
    it('should accept valid CSP report with application/csp-report content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/csp-report',
        },
        body: JSON.stringify({
          'csp-report': {
            'document-uri': 'http://localhost:3000/',
            'violated-directive': 'script-src',
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it('should accept valid CSP report with application/json content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          'csp-report': {
            'document-uri': 'http://localhost:3000/',
            'violated-directive': 'script-src',
          },
        }),
      });

      const response = await POST(request);
      expect(response.status).toBe(204);
    });

    it('should reject requests with invalid content type', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'text/plain',
        },
        body: 'invalid',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toContain('Invalid content type');
    });

    it('should handle malformed JSON gracefully', async () => {
      const request = new NextRequest('http://localhost:3000/api/csp-report', {
        method: 'POST',
        headers: {
          'content-type': 'application/csp-report',
        },
        body: 'not valid json',
      });

      const response = await POST(request);
      // Should still return 204 even on error to not expose implementation details
      expect(response.status).toBe(204);
    });
  });

  describe('GET /api/csp-report', () => {
    it('should reject GET requests with 405 Method Not Allowed', async () => {
      const response = await GET();
      expect(response.status).toBe(405);
      
      const json = await response.json();
      expect(json.error).toBe('Method not allowed');
      
      const allowHeader = response.headers.get('Allow');
      expect(allowHeader).toBe('POST');
    });
  });
});
