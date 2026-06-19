/**
 * ConnectWise Manage implementation of TicketProvider.
 *
 * Wraps the connectwise-rest client and normalizes CW-specific shapes into
 * the generic ExternalTicket / ExternalNote types the sync service expects.
 * The rest of the system has no knowledge of CW API details.
 */

import { getCwm } from '../services/connectwiseService';
import { ConditionBuilder } from '../services/conditionBuilder';
import { TicketProvider, ExternalTicket, ExternalNote } from './TicketProvider';

export class ConnectWiseProvider implements TicketProvider {
  readonly name = 'connectwise';

  private readonly board: string;

  constructor(board = 'SMB Services - SMB Team 1 Support') {
    this.board = board;
  }

  async fetchTickets(since?: Date): Promise<ExternalTicket[]> {
    const cb = new ConditionBuilder()
      .addCondition('board/name', '=', this.board)
      .addNotInCondition('status/name', ['Closed', 'Admin Closed', 'Complete', 'Canceled', 'Closed/No Response'])
      .addCondition('parentTicketId', '=', null);

    if (since) {
      cb.addCondition('_info/lastUpdated', '>', since);
    }

    const raw = await getCwm().ServiceAPI.getServiceTickets({ conditions: cb.build(), page: 1, pageSize: 1000 });
    return (raw as Record<string, unknown>[]).map((t) => this.normalizeTicket(t));
  }

  async fetchNotes(externalTicketId: string): Promise<ExternalNote[]> {
    const raw = await getCwm().ServiceAPI.getServiceTicketsByParentIdNotes(parseInt(externalTicketId), {
      page: 1,
      pageSize: 1000,
    });
    return (raw as Record<string, unknown>[]).map((n) => this.normalizeNote(n));
  }

  private normalizeTicket(t: Record<string, unknown>): ExternalTicket {
    const company = t['company'] as Record<string, unknown> | undefined;
    const status = t['status'] as Record<string, unknown> | undefined;
    const priority = t['priority'] as Record<string, unknown> | undefined;

    return {
      externalId: String(t['id']),
      ticketNumber: String(t['id']),
      title: String(t['summary'] ?? ''),
      summary: String(t['summary'] ?? ''),
      description: String(t['initialDescription'] ?? ''),
      status: String(status?.['name'] ?? 'New'),
      priority: String(priority?.['name'] ?? ''),
      companyName: String(company?.['name'] ?? ''),
      assignee: String(t['resources'] ?? ''),
    };
  }

  private normalizeNote(n: Record<string, unknown>): ExternalNote {
    const member = n['member'] as Record<string, unknown> | undefined;
    const isTimeEntry = Boolean(n['timeStart']);

    return {
      externalId: String(n['id']),
      content: String(n['text'] ?? ''),
      author: member ? `${member['firstName']} ${member['lastName']}` : 'Unknown',
      noteType: isTimeEntry ? 'time_entry' : 'note',
      timeStart: n['timeStart'] ? new Date(n['timeStart'] as string) : undefined,
      timeStop: n['timeEnd'] ? new Date(n['timeEnd'] as string) : undefined,
      createdAt: n['_info'] ? new Date((n['_info'] as Record<string, unknown>)['dateCreated'] as string) : undefined,
    };
  }
}
