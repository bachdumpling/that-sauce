// lib/api-utils/response.ts
import { NextResponse } from 'next/server';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export function successResponse<T>(data: T, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message
  } as ApiResponse<T>);
}

export function errorResponse(error: string, status: number = 400): NextResponse {
  return NextResponse.json({
    success: false,
    error
  } as ApiResponse, { status });
}

export function serverErrorResponse(error: unknown): NextResponse {
  console.error('API Error:', error);
  
  const message = error instanceof Error 
    ? error.message 
    : 'An unexpected error occurred';
    
  return NextResponse.json({
    success: false,
    error: message
  } as ApiResponse, { status: 500 });
}

export function notFoundResponse(resource: string = 'Resource'): NextResponse {
  return NextResponse.json({
    success: false,
    error: `${resource} not found`
  } as ApiResponse, { status: 404 });
}

export function unauthorizedResponse(): NextResponse {
  return NextResponse.json({
    success: false,
    error: 'Unauthorized'
  } as ApiResponse, { status: 401 });
}

export function validationErrorResponse(error: string): NextResponse {
  return NextResponse.json({
    success: false,
    error
  } as ApiResponse, { status: 422 });
}