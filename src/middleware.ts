import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = new URL(request.url);
  if (pathname === '/verify' && request.method === 'POST') {
    const url = new URL('/api/verify', request.url);
    return NextResponse.rewrite(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/verify'],
};
