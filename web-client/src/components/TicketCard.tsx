import { Card, CardContent, Typography, Box } from "@mui/material";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import BusinessIcon from "@mui/icons-material/Business";
import { Ticket } from "../interfaces";

// Map of status colors
const statusColors: { [key: string]: string } = {
  "New": "#1976d2",
  "In Progress": "#ff9800",
  "Waiting on Customer": "#f44336",
  "Closed": "#4caf50",
  "Escalated": "#9c27b0",
  // Add more statuses and colors as needed
};

interface TicketCardProps {
  ticket: Ticket;
  onClick: () => void;
  shortenedSummary: string;
}

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onClick, shortenedSummary }) => {
  const statusColor = statusColors[ticket.status] || "#1976d2"; // Default color if status is not defined

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
        <Typography variant="h6" gutterBottom>
          {ticket.ticketTitle}
        </Typography>

        <Typography variant="body2" color="textSecondary">
          {shortenedSummary}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
          <BusinessIcon sx={{ color: "#1976d2", mr: 1 }} />
          <Typography variant="body2" sx={{ color: "#666" }}>
            {ticket.company.CompanyName}
          </Typography>
        </Box>
      </CardContent>

      {/* Status Label at Bottom Right */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          padding: 1,
        }}
      >
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
