# Project Description: Enhanced Ticket Management App

## Objective
The goal is to build a more efficient and automated interface for technicians working with ticket data, leveraging the CW Manage API and an SQL database. The project consists of a backend Node.js app that interacts with the API and a frontend Vite app for user experience. The system aims to automate and streamline ticket handling and improve user interaction by caching data in an SQL database.

---

## Key Components

### 1. **Backend: Node.js App**

#### Overview:
- Uses **Fastify** for the web framework.
- Implements **connectwise-rest** client to interact with the CW Manage API.
- Retrieves and updates ticket data, caching it in an SQL database for quick access.

#### Functionality:
- **Ticket Data Retrieval**:
  - Queries tickets associated with the technician, retrieving:
    - Ticket number
    - Title/summary
    - Initial description
    - Notes and time entries
  - All relevant ticket information is stored in the SQL database for fast retrieval.

- **Supported API Endpoints**:
  - `/updateTicket`:
    - Input: `ticketNumber: integer`
    - Action: Logs new data and updates the ticket record.
    - Output: Success/failure response.
  - `/getTicket`:
    - Input: `ticketNumber: integer`
    - Action: Retrieves detailed information for the specified ticket.
    - Output: Ticket data.
  - `/getTickets`:
    - Input: None
    - Action: Retrieves the entire set of tickets associated with the technician.
    - Output: List of tickets.

- **Reporting**:
  - Generates a report of changes made, with options to view or export data.

---

### 2. **Frontend: Vite App**

#### Overview:
- Uses **Vite** as the web framework and **Material UI** for the design system.
- Presents ticket data in a user-friendly, kanban-style board.
- Enables real-time manipulation of ticket data by the technician.

#### Functionality:
- **Kanban-style board**: Displays tickets, allowing technicians to easily track and update their status.
- **Interactive ticket editing**: Users can propose and review changes to tickets in real-time.
- **Material UI**: Ensures the frontend is intuitive and visually appealing.

---

### 3. **SQL Database**

#### Overview:
The SQL database acts as a cache between the backend API and frontend UI, ensuring efficient data access and storage of ticket-related information.

#### Key Tables:
- **Tickets**:
  - `ticketNumber`: Integer (Primary Key)
  - `ticketTitle`: String
  - `description`: Text
  - `initialDescription`: Text
  - `timeEntries`: JSON (Holds time entry details)
  - `notes`: JSON (Holds ticket notes)

- **TicketUpdates**:
  - `ticketNumber`: Integer (Foreign Key to Tickets)
  - `updateDetails`: JSON (Holds proposed changes)
  - `processed`: Boolean (True/False – whether the update has been processed)

---

## Next Steps
1. **Database Normalization**:
    - Ensure proper normalization of ticket data, breaking down into multiple tables if needed (e.g., separate tables for time entries, notes, etc.).
2. **Backend Logic**:
    - Finalize the Fastify routes and ensure all API integration points are tested.
3. **Frontend Development**:
    - Implement the kanban board with Material UI, ensuring real-time interactivity with the backend.
4. **Data Sync**:
    - Build caching mechanisms to sync data between the CW Manage API and the SQL database, ensuring efficient and up-to-date ticket management.
