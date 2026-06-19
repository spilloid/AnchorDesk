// ./components/KanbanBoard.tsx
import React from "react";
import { Box, Typography } from "@mui/material";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { Ticket } from "../interfaces";
import TicketCard from "./TicketCard";

interface KanbanBoardProps {
  tickets: Ticket[];
  onStatusChange: (ticketId: number, newStatus: string) => void;
  onTicketClick: (ticket: Ticket) => void;
}

const statuses = ["New", "Reviewed", "Scheduled", "InProgress", "Closed"];

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
            {(provided) => (
              <Box
                ref={provided.innerRef}
                {...provided.droppableProps}
                sx={{
                  minWidth: 300,
                  margin: 1,
                  backgroundColor: "#f4f6f8",
                  borderRadius: 2,
                  padding: 1,
                }}
              >
                <Typography variant="h6" sx={{ textAlign: "center" }}>
                  {status}
                </Typography>
                {ticketsByStatus[status]?.map((ticket, index) => (
                  <Draggable
                    draggableId={ticket.ticketnumber.toString()}
                    index={index}
                    key={ticket.ticketnumber}
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
