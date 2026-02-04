import type { Response } from 'express';

export interface SSEOptions {
  res: Response;
}

export function setupSSE({ res }: SSEOptions): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

export function sendSSE(res: Response, data: unknown): void {
  if (res.writableEnded || res.destroyed) {
    return;
  }
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export function sendSSERaw(res: Response, data: string): void {
  if (res.writableEnded || res.destroyed) {
    return;
  }
  res.write(`data: ${data}\n\n`);
}

export function endSSE(res: Response): void {
  if (res.writableEnded || res.destroyed) {
    return;
  }
  res.write('data: [DONE]\n\n');
  res.end();
}
