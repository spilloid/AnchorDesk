import {
  buildReferenceChain,
  generateMessageId,
  tagSubjectWithTicket,
  ticketNumberFromSubject,
} from './threading';

describe('buildReferenceChain', () => {
  it('returns empty chain for a brand-new thread', () => {
    expect(buildReferenceChain(null, [])).toEqual({ references: [], inReplyTo: undefined });
  });

  it('uses the root message-id when there are no prior notes', () => {
    expect(buildReferenceChain('<root@x>', [])).toEqual({
      references: ['<root@x>'],
      inReplyTo: '<root@x>',
    });
  });

  it('chains root + prior ids in order and sets In-Reply-To to the latest', () => {
    const r = buildReferenceChain('<root@x>', ['<a@x>', '<b@x>']);
    expect(r.references).toEqual(['<root@x>', '<a@x>', '<b@x>']);
    expect(r.inReplyTo).toBe('<b@x>');
  });

  it('de-duplicates ids and drops nulls (root may already appear as a note)', () => {
    const r = buildReferenceChain('<root@x>', ['<root@x>', null, '<a@x>', '<a@x>']);
    expect(r.references).toEqual(['<root@x>', '<a@x>']);
    expect(r.inReplyTo).toBe('<a@x>');
  });

  it('threads off prior notes even when there is no ticket root id', () => {
    const r = buildReferenceChain(null, ['<a@x>']);
    expect(r.references).toEqual(['<a@x>']);
    expect(r.inReplyTo).toBe('<a@x>');
  });
});

describe('generateMessageId', () => {
  it('roots the id on the sender domain', () => {
    expect(generateMessageId('help@acme.com')).toMatch(/^<[0-9a-f-]+@acme\.com>$/);
  });

  it('handles a display-name address form', () => {
    expect(generateMessageId('"Help" <help@acme.com>')).toMatch(/@acme\.com>$/);
  });

  it('falls back to a default domain when none is present', () => {
    expect(generateMessageId('invalid-from')).toMatch(/@anchordesk\.local>$/);
  });

  it('produces unique ids', () => {
    expect(generateMessageId('a@b.com')).not.toBe(generateMessageId('a@b.com'));
  });
});

describe('ticket-number subject tags', () => {
  it('prepends a public ticket number to outbound subjects', () => {
    expect(tagSubjectWithTicket('Printer is offline', '10042')).toBe('[#10042] Printer is offline');
  });

  it('does not duplicate an existing tag', () => {
    expect(tagSubjectWithTicket('[#10042] Printer is offline', '10042')).toBe('[#10042] Printer is offline');
  });

  it('extracts bracketed and bare ticket numbers from replies', () => {
    expect(ticketNumberFromSubject('Re: [#10042] Printer is offline')).toBe('10042');
    expect(ticketNumberFromSubject('Re: ticket #10042')).toBe('10042');
  });

  it('ignores subjects without a supported ticket number', () => {
    expect(ticketNumberFromSubject('Hello there')).toBeNull();
    expect(ticketNumberFromSubject('Issue #42')).toBeNull();
  });
});
