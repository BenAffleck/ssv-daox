import { describe, it, expect } from 'vitest';
import {
  transformSnapshotProposal,
  transformSnapshotProposals,
} from '../logic/event-transformer';
import { EventSource, EventSourceConfig } from '../types';
import { SnapshotTimelineProposal } from '@/lib/snapshot/types';

describe('Snapshot proposal transformer', () => {
  const mockSource: EventSourceConfig = {
    id: 'snapshot-proposals',
    type: EventSource.SNAPSHOT_PROPOSALS,
    name: 'Governance',
    enabled: true,
    url: 'mainnet.ssvnetwork.eth',
    color: 'secondary',
  };

  const mockProposal: SnapshotTimelineProposal = {
    id: 'QmTest123',
    title: 'SIP-42: Improve Validator Performance',
    body: 'This proposal aims to improve validator performance by implementing new optimizations.',
    created: 1700000000,
    start: 1700100000,
    end: 1700700000,
    state: 'active',
    link: 'https://snapshot.org/#/mainnet.ssvnetwork.eth/proposal/QmTest123',
  };

  describe('transformSnapshotProposal', () => {
    it('should transform proposal to UnifiedEvent', () => {
      const result = transformSnapshotProposal(
        mockProposal,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(result.id).toBe('snapshot-proposals-QmTest123');
      expect(result.sourceId).toBe('snapshot-proposals');
      expect(result.title).toBe('SIP-42: Improve Validator Performance');
      expect(result.description).toBe(mockProposal.body);
      expect(result.source).toBe(EventSource.SNAPSHOT_PROPOSALS);
      expect(result.sourceName).toBe('Governance');
      expect(result.isRecurring).toBe(false);
      expect(result.isAllDay).toBe(false);
      expect(result.location).toBeNull();
    });

    it('should convert Unix timestamps to Date objects', () => {
      const result = transformSnapshotProposal(
        mockProposal,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.startDate.getTime()).toBe(1700100000 * 1000);
      expect(result.endDate?.getTime()).toBe(1700700000 * 1000);
    });

    it('should use proposal link as sourceUrl', () => {
      const result = transformSnapshotProposal(
        mockProposal,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(result.sourceUrl).toBe(mockProposal.link);
    });

    it('should construct URL if link is empty', () => {
      const proposalWithoutLink: SnapshotTimelineProposal = {
        ...mockProposal,
        link: '',
      };

      const result = transformSnapshotProposal(
        proposalWithoutLink,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(result.sourceUrl).toBe(
        'https://snapshot.org/#/mainnet.ssvnetwork.eth/proposal/QmTest123'
      );
    });

    it('should include state in metadata', () => {
      const result = transformSnapshotProposal(
        mockProposal,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(result.metadata.state).toBe('active');
      expect(result.metadata.created).toBe(1700000000);
      expect(result.metadata.spaceId).toBe('mainnet.ssvnetwork.eth');
    });

    it('should truncate long descriptions', () => {
      const longBody = 'A'.repeat(600);
      const proposalWithLongBody: SnapshotTimelineProposal = {
        ...mockProposal,
        body: longBody,
      };

      const result = transformSnapshotProposal(
        proposalWithLongBody,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(result.description?.length).toBeLessThanOrEqual(503); // 500 + '...'
      expect(result.description?.endsWith('...')).toBe(true);
    });

    it('should handle null/empty body', () => {
      const proposalWithEmptyBody: SnapshotTimelineProposal = {
        ...mockProposal,
        body: '',
      };

      const result = transformSnapshotProposal(
        proposalWithEmptyBody,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(result.description).toBeNull();
    });
  });

  describe('transformSnapshotProposals', () => {
    it('should transform multiple proposals', () => {
      const proposals: SnapshotTimelineProposal[] = [
        mockProposal,
        {
          ...mockProposal,
          id: 'QmTest456',
          title: 'SIP-43: Another Proposal',
          state: 'closed',
        },
      ];

      const results = transformSnapshotProposals(
        proposals,
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(results).toHaveLength(2);
      expect(results[0].id).toBe('snapshot-proposals-QmTest123');
      expect(results[1].id).toBe('snapshot-proposals-QmTest456');
      expect(results[1].metadata.state).toBe('closed');
    });

    it('should return empty array for empty input', () => {
      const results = transformSnapshotProposals(
        [],
        mockSource,
        'mainnet.ssvnetwork.eth'
      );

      expect(results).toEqual([]);
    });
  });
});
