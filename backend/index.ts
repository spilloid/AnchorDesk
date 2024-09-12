// Import Fastify, ManageAPI, and dotenv to load environment variables
import fastify, { FastifyRequest, FastifyReply } from 'fastify';
import { ManageAPI } from 'connectwise-rest';
import dotenv from 'dotenv';

// Load environment variables from the .env file
dotenv.config();

// Define the structure of request params for TypeScript
interface TicketParams {
  ticketId: string;
}

interface ResourceParams {
  resource: string;
}

// Initialize the ManageAPI with credentials from environment variables
const cwm = new ManageAPI({
  companyId: process.env.CWM_COMPANY || '',
  companyUrl: process.env.CWM_SERVER || '',
  publicKey: process.env.CWM_PUBKEY || '',
  privateKey: process.env.CWM_PRIVATEKEY || '',
  clientId: process.env.CWM_CLIENTID || '',
  entryPoint: 'v4_6_release', // optional, defaults to 'v4_6_release'
  apiVersion: '3.0.0',        // optional, defaults to '3.0.0'
  timeout: 20000,             // optional, request connection timeout in ms
  retry: false,               // optional, defaults to false
  retryOptions: {
    retries: 4,
    minTimeout: 50,
    maxTimeout: 45000,
    randomize: true,
  },
  debug: true,
});

// Create a new Fastify instance
const server = fastify({ logger: true });

// Simple ping route for testing
server.get('/ping', async (request: FastifyRequest, reply: FastifyReply) => {
  return 'pong\n';
});

// Tickets route to get a specific ticket by ID
server.get('/Tickets/:ticketId', async (request: FastifyRequest<{ Params: TicketParams }>, reply: FastifyReply) => {
  const { ticketId } = request.params;

  try {
    // Call ConnectWise API to get ticket by ID using getServiceTicketsById
    const ticket = await cwm.ServiceAPI.getServiceTicketsById(parseInt(ticketId));

    // Return the ticket data directly
    return reply.send(ticket);
  } catch (error) {
    // Handle errors (e.g., ticket not found or API errors)
    console.error('Error fetching ticket:', error);
    return reply.status(500).send({ error: 'Unable to fetch ticket' });
  }
});

// Fetch tickets from ConnectWise API with the defined conditions
server.get('/Tickets/Open', async (request: FastifyRequest, reply: FastifyReply) => {
  const conditions = "board/name='SMB Services - SMB Team 1 Support' AND status/name!='Closed' AND status/name!='Admin Closed' AND status/name!='Complete' AND status/name!='Canceled' AND status/name!='Closed/No Response' AND (resources='NULL' OR resources='') AND parentTicketId=NULL";

  try {
    // Call ConnectWise API to get tickets with the specified conditions and a default pageSize of 1000
    const tickets = await cwm.ServiceAPI.getServiceTickets({
      conditions,
      page: 1, // Default to the first page
      pageSize: 1000, // Fetch 1000 tickets per page
    });

    // Return the list of tickets
    return reply.send(tickets);
  } catch (error) {
    // Handle errors (e.g., API errors)
    console.error('Error fetching tickets:', error);
    return reply.status(500).send({ error: 'Unable to fetch tickets' });
  }
});

// New route: Fetch tickets by dynamic resource parameter
server.get('/Tickets/ByResource/:resource', async (request: FastifyRequest<{ Params: ResourceParams }>, reply: FastifyReply) => {
  const { resource } = request.params; // Get the resource parameter from the URL
  const conditions = `resources='${resource}' AND status/name not like '%Closed%' AND status/name!='Complete' AND status/name!='Canceled' AND board/name='SMB Services - SMB Team 1 Support'`;

  try {
    // Call ConnectWise API to get tickets assigned to the specified resource and not closed
    const tickets = await cwm.ServiceAPI.getServiceTickets({
      conditions,
      page: 1, // Default to the first page
      pageSize: 1000, // Fetch 1000 tickets per page
    });

    // Return the list of tickets
    return reply.send(tickets);
  } catch (error) {
    // Handle errors (e.g., API errors)
    console.error(`Error fetching tickets for resource ${resource}:`, error);
    return reply.status(500).send({ error: `Unable to fetch tickets for resource ${resource}` });
  }
});

// Add the GET /Tickets/:ticketId/notes route to get ticket notes
server.get('/Tickets/:ticketId/Notes', async (request: FastifyRequest<{ Params: TicketParams }>, reply: FastifyReply) => {
  const { ticketId } = request.params;

  try {
    // Call ConnectWise API to get notes for the specific ticket using getServiceTicketsByParentIdNotes
    const notes = await cwm.ServiceAPI.getServiceTicketsByParentIdNotes(parseInt(ticketId));

    // Return the list of ticket notes
    return reply.send(notes);
  } catch (error) {
    // Handle errors (e.g., API errors or ticket not found)
    console.error('Error fetching ticket notes:', error);
    return reply.status(500).send({ error: 'Unable to fetch ticket notes' });
  }
});

// Start the server and listen on port 8060
server.listen({ port: 8060, host: '0.0.0.0' }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
