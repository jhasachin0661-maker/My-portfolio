import { z } from 'zod';

export const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8).max(128) });
export const contactSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(160),
  subject: z.string().trim().min(2).max(140),
  message: z.string().trim().min(10).max(5000),
});
export const projectSchema = z.object({
  number: z.coerce.number().int().min(1), name: z.string().trim().min(2).max(120), slug: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1000), details: z.string().max(10000).optional().nullable(), stack: z.string().min(2).max(500),
  problem: z.string().max(2000).optional().nullable(), solution: z.string().max(2000).optional().nullable(),
  challenges: z.string().max(2000).optional().nullable(), learnings: z.string().max(2000).optional().nullable(),
  tags: z.string().max(300).optional().nullable(), gallery: z.string().max(3000).optional().nullable(),
  status: z.string().min(2).max(60), year: z.string().min(4).max(20), liveUrl: z.string().url().optional().or(z.literal('')).nullable(),
  githubUrl: z.string().url().optional().or(z.literal('')).nullable(), imageUrl: z.string().url().optional().or(z.literal('')).nullable(), featured: z.coerce.boolean().optional()
});
export const skillSchema = z.object({ category: z.string().min(2).max(60), name: z.string().min(1).max(80), description: z.string().max(300).optional().nullable(), order: z.coerce.number().int().min(0) });
export const journeySchema = z.object({ period: z.string().min(2).max(40), title: z.string().min(2).max(120), description: z.string().min(5).max(1000), order: z.coerce.number().int().min(0) });
export const buildSchema = z.object({ name: z.string().min(2).max(120), status: z.string().min(2).max(60), description: z.string().min(5).max(1000), stack: z.string().min(2).max(300), objective: z.string().min(5).max(1000), buildPhase: z.string().max(60).optional().nullable() });
export const labSchema = z.object({ title: z.string().min(2).max(120), description: z.string().min(5).max(1000), stack: z.string().min(2).max(300), status: z.string().min(2).max(60), link: z.string().url().optional().or(z.literal('')).nullable(), order: z.coerce.number().int().min(0).optional() });
export const settingsSchema = z.object({
  name: z.string().min(2).max(120).optional(), role: z.string().min(2).max(160).optional(), tagline: z.string().min(2).max(200).optional(),
  location: z.string().min(2).max(120).optional(), email: z.string().email().optional(), github: z.string().url().optional().or(z.literal('')).nullable(),
  linkedin: z.string().url().optional().or(z.literal('')).nullable(), resumeUrl: z.string().url().optional().or(z.literal('')).nullable(), availability: z.string().min(2).max(160).optional()
});
