import type { z, ZodType } from 'zod';

/**
 * Derives a NestJS DTO class from a zod schema already defined in
 * `libs/contracts`, so validation schema stays single-sourced between
 * FE and BE instead of being re-declared with class-validator decorators.
 */
export function createZodDto<T extends ZodType>(schema: T) {
  class ZodDto {
    static readonly schema: T = schema;
  }
  return ZodDto as { new (): z.infer<T>; schema: T };
}
