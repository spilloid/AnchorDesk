/**
 * TicketProvider — Strategy interface for external ticket sources.
 *
 * Implement this interface to add a new sync source (ConnectWise, IMAP, etc.).
 * The sync service calls these methods; it does not know or care which provider
 * it is talking to. See ConnectWiseProvider.ts for the reference implementation.
 *
 * GoF pattern: Strategy
 */

export interface ExternalTicket {
  externalId: string;
  ticketNumber?: string;
  title: string;
  summary?: string;
  description?: string;
  status: string;
  priority?: string;
  companyName?: string;
  assignee?: string;
}

export interface ExternalNote {
  externalId: string;
  content: string;
  author: string;
  noteType: 'note' | 'time_entry';
  timeStart?: Date;
  timeStop?: Date;
  createdAt?: Date;
}

export interface TicketProvider {
  /** Human-readable name used in sync_log records. */
  readonly name: string;

  /** Fetch tickets modified since `since`, or all tickets if omitted. */
  fetchTickets(since?: Date): Promise<ExternalTicket[]>;

  /** Fetch notes for a single ticket by its external ID. */
  fetchNotes(externalTicketId: string): Promise<ExternalNote[]>;

  /** Push a local ticket to the external system. Returns the external ID.
   *  Optional — outbound sync is not required for all providers. */
  pushTicket?(ticket: { title: string; description?: string; companyName?: string }): Promise<string>;

  /** Push a note to the external system. Optional. */
  pushNote?(externalTicketId: string, note: { content: string; author: string }): Promise<void>;
}
