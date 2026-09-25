import { NextResponse } from 'next/server';

/** The error body every opt-out route returns: `{ error: { code, message } }`. */
export function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ error: { code, message } }, { status });
}
