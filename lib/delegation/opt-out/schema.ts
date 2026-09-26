import { isAddress, type Address } from 'viem';
import { z } from 'zod';

import { buildOptOutTypedData, OPT_OUT_ACTIONS, type OptOutSubmission } from './typed-data';

const addressSchema = z
  .string()
  .refine((value) => isAddress(value, { strict: false }), 'Invalid address')
  .transform((value) => value as Address);

export const nonceRequestSchema = z.object({
  address: addressSchema,
  action: z.enum(OPT_OUT_ACTIONS),
});

export const safeSignatureQuerySchema = z.object({ nonce: z.string().min(1) });

/** Only the message is read: domain and types are always DAOx's own. */
const submissionSchema = z.object({
  typedData: z.object({
    message: z.object({
      address: addressSchema,
      action: z.enum(OPT_OUT_ACTIONS),
      nonce: z.string().min(1),
      issuedAt: z.string().min(1),
    }),
  }),
  signature: z
    .string()
    // `0x` is a Safe's on-chain signature (SignMessageLib).
    .regex(/^0x[0-9a-fA-F]*$/, 'Invalid signature')
    .transform((value) => value as `0x${string}`),
});

export function parseSubmission(body: unknown): OptOutSubmission | null {
  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    return null;
  }
  return {
    typedData: buildOptOutTypedData(parsed.data.typedData.message),
    signature: parsed.data.signature,
  };
}
