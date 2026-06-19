import React from "react";
import { Card, CardContent, Typography, Box, Avatar } from "@mui/material";
import BusinessIcon from "@mui/icons-material/Business";
import { Ticket } from "../interfaces";

// Map of status colors
const statusColors: { [key: string]: string } = {
  New: "#1976d2",           // Blue (Primary)
  Open: "#1976d2",          // Blue (Primary)
  Reviewed: "#0288d1",       // Lighter Blue
  Scheduled: "#7b1fa2",      // Purple
  InProgress: "#ff9800",     // Orange
  Closed: "#4caf50",         // Green
  Cancelled: "#d32f2f",      // Red
  OnHold: "#fbc02d",         // Yellow
  Deferred: "#8e24aa",       // Dark Purple
  Completed: "#388e3c",      // Dark Green
  Failed: "#e53935",         // Dark Red
  Blocked: "#ff7043",        // Muted Orange
  Pending: "#c2185b",        // Magenta
  Approved: "#009688",       // Teal
};

// Map of priority colors
const priorityColors: { [key: number]: string } = {
  1: "#f44336", // Red
  2: "#ff9800", // Orange
  3: "#ffeb3b", // Yellow
  4: "#2196f3", // Blue
  5: "#ffffff", // White
  6: "#9c27b0", // Purple
};

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
  shortenedSummary: string;
}

const TicketCard: React.FC<TicketCardProps> = ({
  ticket,
  onClick,
  shortenedSummary,
}) => {
  const statusColor = statusColors[ticket.status] || "#1976d2";
  const priorityNumber = parseInt(ticket.priority, 10);
  const priorityColor = priorityColors[priorityNumber] || "#1976d2";

  const formattedDate = new Date(ticket.dateEntered).toLocaleString();

  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        cursor: "pointer",
        padding: 2,
        background: "linear-gradient(135deg, #ffffff 0%, #f4f6f8 100%)",
        borderRadius: 2,
        border: "2px solid #1976d2",
        boxShadow: "0 8px 16px rgba(0, 0, 0, 0.2)",
        "&:hover": {
          boxShadow: "0 12px 24px rgba(0, 0, 0, 0.3)",
          border: `2px solid ${statusColor}`,
        },
      }}
      onClick={onClick}
    >
      <CardContent>
        {/* Ticket Title */}
        <Typography variant="h6" gutterBottom>
          {ticket.ticketTitle}
        </Typography>

        {/* Summary */}
        <Typography variant="body2" color="textSecondary">
          {shortenedSummary}
        </Typography>

        {/* Company */}
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <BusinessIcon sx={{ color: "#1976d2", mr: 1 }} />
          <Typography variant="body2" sx={{ color: "#666" }}>
            {ticket.company.CompanyName}
          </Typography>
        </Box>

        {/* Date Entered */}
        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <Typography variant="body2" sx={{ color: "#666" }}>
            <strong>Date Entered:</strong> {formattedDate}
          </Typography>
        </Box>
      </CardContent>

      {/* Bottom Section */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: 1,
        }}
      >
        {/* Priority Circle */}
        <Avatar
          sx={{
            bgcolor: priorityColor,
            color: "#fff", // Ensuring the text color is white
            width: 32,
            height: 32,
            border: "2px solid black",  // Black stroke around the exterior circle
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontWeight: "bold",  // Make the text bold for better visibility
            textShadow: "1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000",  // Black stroke effect on text
          }}
        >
          {priorityNumber}
        </Avatar>

        {/* Status Label */}
        <Typography
          variant="body2"
          sx={{
            backgroundColor: statusColor,
            color: "#fff",
            borderRadius: 4,
            padding: "4px 8px",
            fontWeight: "bold",
            display: "inline-block",
          }}
        >
          {ticket.status}
        </Typography>
      </Box>
    </Card>
  );
};

export default TicketCard;
