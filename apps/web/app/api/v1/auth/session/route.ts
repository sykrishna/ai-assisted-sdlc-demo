import { NextResponse } from 'next/server';
import {
  createSessionResponse,
  getProblemDetails,
} from '../../../../../src/features/auth/server/mock-auth-server';

function extractAccessToken(headerValue: string | null): string | undefined {
  if (!headerValue?.startsWith('Bearer ')) {
    return undefined;
  }

  return headerValue.slice('Bearer '.length);
}

export async function GET(request: Request) {
  try {
    const accessToken = extractAccessToken(request.headers.get('authorization'));
    return NextResponse.json(createSessionResponse(accessToken), { status: 200 });
  } catch (error) {
    const problem = getProblemDetails(error);
    return NextResponse.json(problem, { status: problem.status });
  }
}
