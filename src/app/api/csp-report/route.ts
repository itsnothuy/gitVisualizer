import { logWarning } from '@/lib/logging';
import { NextRequest, NextResponse } from 'next/server';

/**
 * CSP Violation Report Endpoint
 * 
 * Accepts Content Security Policy violation reports and logs them locally.
 * This endpoint does NOT send data to external services - all reports stay local.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the CSP report
    const contentType = request.headers.get('content-type') || '';

    // CSP reports can be sent as application/csp-report or application/json
    if (!contentType.includes('application/csp-report') && !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected application/csp-report or application/json' },
        { status: 400 }
      );
    }

    const report = await request.json();

    // Validate the structure of the CSP report
    if (!report || typeof report !== 'object' || !report['csp-report']) {
      logWarning('Invalid CSP report structure', { report });
      return NextResponse.json(
        { error: 'Invalid CSP report structure' },
        { status: 400 }
      );
    }

    // Log the CSP violation locally
    logWarning('CSP Violation Report', {
      report,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    });

    // Return 204 No Content as per CSP reporting spec
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    // Log parsing errors but don't expose details to client
    logWarning('Failed to process CSP report', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    return new NextResponse(null, { status: 204 });
  }
}

// Explicitly disable other HTTP methods
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { 'Allow': 'POST' } }
  );
}
