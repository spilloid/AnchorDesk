// ./components/KanbanBoard.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Ticket } from "../interfaces";
import TicketCard from "./TicketCard";
import { TICKET_STATUSES } from "../ticketVocab";

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: number, newStatus: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

const statuses = TICKET_STATUSES;

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  tickets,
  onStatusChange,
  onTicketClick,
}) => {
  const ticketsByStatus = statuses.reduce((acc, status) => {
    acc[status] = tickets.filter((ticket) => ticket.status === status);
    return acc;
  }, {} as { [key: string]: Ticket[] });

  const handleDragEnd = (result: any) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;
    if (source.droppableId !== destination.droppableId) {
      onStatusChange(Number(draggableId), destination.droppableId);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: "flex", overflowX: "auto" }}>
        {statuses.map((status) => (
          <Droppable droppableId={status} key={status}>
            {(provided, snapshot) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  minWidth: 290,
                  width: 290,
                  mx: 1,
                  bgcolor: snapshot.isDraggingOver ? "action.selected" : "grey.50",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 2,
                  p: 1,
                  minHeight: 120,
                }}
              >
                <Typography variant="subtitle2" sx={{ px: 0.5, mb: 1, color: "text.secondary", fontWeight: 700 }}>
                  {status.toUpperCase()} · {ticketsByStatus[status]?.length ?? 0}
                </Typography>
                {ticketsByStatus[status]?.map((ticket, index) => (
                  <Draggable
                    draggableId={String(ticket.localId ?? ticket.ticketnumber)}
                    index={index}
                    key={ticket.localId ?? ticket.ticketnumber}
                  >
                    {(provided) => (
                      <Box
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        sx={{ marginBottom: 2 }}
                      >
                        <TicketCard
                          ticket={ticket}
                          onClick={() => onTicketClick(ticket)}
                          shortenedSummary={ticket.ticketSummary}
                        />
                      </Box>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </Box>
            )}
          </Droppable>
        ))}
      </Box>
    </DragDropContext>
  );
};

export default KanbanBoard;
