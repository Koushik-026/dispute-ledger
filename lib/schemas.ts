// Zod validation schemas for API input/output

import { z } from 'zod';

export const AnalyzeInputSchema = z.object({
  caseId: z.string().min(1),
});

export const OutcomeInputSchema = z.object({
  caseId: z.string().min(1),
  outcome: z.enum(['won', 'lost']),
  notes: z.string().optional(),
});

export const MemorySearchInputSchema = z.object({
  query: z.string().min(1).max(500),
});

export const PlaybookActionSchema = z.object({
  action: z.enum(['refresh']),
});

export const RecommendedEvidenceSchema = z.object({
  type: z.string(),
  why: z.string(),
  supported_by: z.array(z.string()).default([]),
});

export const MemoryOnResultSchema = z.object({
  summary: z.string(),
  recommended_evidence: z.array(RecommendedEvidenceSchema),
  deprioritize: z.array(RecommendedEvidenceSchema).default([]),
  historical_patterns: z.array(z.string()).default([]),
  caveats: z.array(z.string()).default([]),
  draft_focus: z.array(z.string()).default([]),
  draft: z.string(),
});

export type AnalyzeInput = z.infer<typeof AnalyzeInputSchema>;
export type OutcomeInput = z.infer<typeof OutcomeInputSchema>;
export type MemoryOnResult = z.infer<typeof MemoryOnResultSchema>;
