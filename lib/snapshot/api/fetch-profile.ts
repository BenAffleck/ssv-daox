import { SSV_SPACE_ID } from '@/lib/gnosis/config';

import { SNAPSHOT_CONFIG } from '../config';
import type { SnapshotGraphQLResponse } from '../types';

/** A Snapshot user's public name and delegate statement in the SSV space. */
export interface SnapshotProfile {
  name: string | null;
  statement: string | null;
}

interface ProfileQueryResponse {
  user: { name: string | null } | null;
  statements: { statement: string | null }[];
}

const PROFILE_QUERY = `
  query Profile($address: String!, $space: String!) {
    user(id: $address) {
      name
    }
    statements(first: 1, where: { delegate_in: [$address], space: $space }) {
      statement
    }
  }
`;

function nonBlank(value: string | null | undefined): string | null {
  return value?.trim() ? value.trim() : null;
}

/** Snapshot's avatar service: the profile picture, ENS avatar or a generated one. */
export function snapshotAvatarUrl(address: string): string {
  return `https://cdn.stamp.fyi/avatar/eth:${address.toLowerCase()}?s=128`;
}

export function snapshotProfileUrl(address: string): string {
  return `https://snapshot.org/#/s:${SSV_SPACE_ID}/profile/${address}`;
}

/** Returns `null` when the lookup fails; the page then shows no statement. */
export async function fetchSnapshotProfile(address: string): Promise<SnapshotProfile | null> {
  try {
    const response = await fetch(SNAPSHOT_CONFIG.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: PROFILE_QUERY,
        variables: { address: address.toLowerCase(), space: SSV_SPACE_ID },
      }),
      next: { revalidate: SNAPSHOT_CONFIG.cacheSeconds },
    });
    if (!response.ok) {
      return null;
    }
    const result: SnapshotGraphQLResponse<ProfileQueryResponse> = await response.json();
    if (result.errors?.length || !result.data) {
      return null;
    }
    return {
      name: nonBlank(result.data.user?.name),
      statement: nonBlank(result.data.statements[0]?.statement),
    };
  } catch {
    return null;
  }
}
