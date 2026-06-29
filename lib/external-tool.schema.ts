import { z } from 'zod';
// Relative import (not the @/ alias) so the build-time generator can run this
// module under tsx without alias resolution. App/test code still imports this
// file via the @/ alias as usual.
import { ExternalToolCategory, ExternalTool } from './types';

/**
 * Validation schema for a community-contributed external tool.
 *
 * This is the single source of truth for what a `data/external-tools/<id>.json`
 * file may contain. It is consumed both at build time (the `gen:tools` generator
 * in `scripts/gen-external-tools.ts`) and by the unit tests, so an invalid
 * contribution fails fast with a clear message before it can be merged.
 *
 * Contributors only provide the input fields below. Derived/optional values
 * (`host`, `featured`, `sortOrder`) are normalised by the generator.
 */
export const externalToolSchema = z.object({
  /** Unique kebab-case identifier, e.g. "stake-easy". Never displayed. */
  id: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id must be lower-case kebab-case (e.g. "my-tool")'),
  /** Display name. */
  name: z.string().min(1),
  /** One- or two-sentence description of what the tool does and for whom. */
  description: z.string().min(1),
  /** One or more categories; drives the filter and the auto-selected icon. */
  categories: z.array(z.nativeEnum(ExternalToolCategory)).min(1, 'at least one category is required'),
  /** Short formula-style inputs string, segments separated by " · ". */
  inputs: z.string().min(1),
  /** Short formula-style outputs string, segments separated by " · ". */
  outputs: z.string().min(1),
  /** Destination URL. Must be an absolute http(s) URL. */
  url: z.string().url(),
  /** Display host (e.g. "stakeeasy.xyz"). Derived from `url` when omitted. */
  host: z.string().min(1).optional(),
  /** Maintainer-only: pin to the top of the list with a "Featured" pill. */
  featured: z.boolean().optional(),
  /** Optional ordering hint within the featured / non-featured group. */
  sortOrder: z.number().optional(),

  /** Allowed so the JSON files can reference the JSON Schema for editor hints. */
  $schema: z.string().optional(),
});

/** The raw, as-authored shape of a tool JSON file. */
export type ExternalToolInput = z.infer<typeof externalToolSchema>;

/**
 * Validate and normalise a single raw tool entry into a complete `ExternalTool`.
 * Derives `host` from the URL when absent and defaults `featured`/`sortOrder`.
 * Throws (via zod) when the input is invalid.
 */
export function parseExternalTool(raw: unknown, index = 0): ExternalTool {
  const input = externalToolSchema.parse(raw);
  return {
    id: input.id,
    name: input.name,
    description: input.description,
    categories: input.categories,
    inputs: input.inputs,
    outputs: input.outputs,
    url: input.url,
    host: input.host ?? new URL(input.url).host,
    featured: input.featured ?? false,
    // Default unset sortOrder to a large, stable value so explicitly-ordered
    // tools sort first; ties are broken by name in getExternalToolsSorted().
    sortOrder: input.sortOrder ?? 1000 + index,
  };
}
