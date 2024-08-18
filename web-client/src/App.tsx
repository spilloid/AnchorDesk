import { useState, useEffect, useCallback } from "react";
import {
  Box,
  CssBaseline,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  ThemeProvider,
  Toolbar,
  Grid,
} from "@mui/material";
import { createTheme } from "@mui/material/styles";
import DashboardAppBar from "./components/DashboardAppBar";
import DashboardDrawer from "./components/DashboardDrawer";
import { Ticket, Technician, TimeEntry } from "./interfaces";

// Define Theme for Styling
const defaultTheme = createTheme({
  palette: {
    primary: { main: "#1976d2" },
    secondary: { main: "#f50057" },
    background: { default: "#f4f6f8" },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: "Roboto, Arial, sans-serif",
  },
});

function App() {
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/Tickets"); // Update with your DB2Rest endpoint
      if (!response.ok) {
        throw new Error("Failed to fetch tickets");
      }
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const renderTechnicians = (technicians: Technician[] | undefined) => {
    if (!Array.isArray(technicians) || technicians.length === 0) {
      return <Typography variant="body2">No technicians available</Typography>;
    }

    return technicians.map((technician) => (
      <Typography variant="body2" key={technician.TechnicianID}>
        {`${technician.FirstName} ${technician.LastName} (${technician.Username})`}
      </Typography>
    ));
  };

  const renderTimeEntries = (timeEntries: TimeEntry[] | undefined) => {
    if (!Array.isArray(timeEntries) || timeEntries.length === 0) {
      return <Typography variant="body2">No time entries available</Typography>;
    }

    return timeEntries.map((entry) => (
      <Box key={entry.TimeEntryID} sx={{ my: 1 }}>
        <Typography variant="body2">{`Time Start: ${entry.TimeStart}`}</Typography>
        <Typography variant="body2">{`Time Stop: ${entry.TimeStop}`}</Typography>
        <Typography variant="body2">{`Note: ${
          entry.TimeNote?.toString("utf-8") || "No Note"
        }`}</Typography>
        <Typography variant="body2">{`Technician: ${
          entry.Technician?.FirstName || "N/A"
        } ${entry.Technician?.LastName || ""}`}</Typography>
      </Box>
    ));
  };

  const handleCardClick = (ticket: Ticket) => {
    console.log("Time Entries for Ticket #", ticket.ticketnumber);
    console.log(ticket.timeEntries);
  };

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <CssBaseline />
        <DashboardAppBar drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
        <DashboardDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, backgroundColor: "background.default" }}>
          <Toolbar /> {/* To offset the AppBar height */}

          {error && <Typography color="error">Error: {error.message}</Typography>}
          {loading ? (
            <CircularProgress />
          ) : tickets.length > 0 ? (
            <>
              <Typography variant="h5" gutterBottom>
                Total Tickets: {tickets.length}
              </Typography>
              <Grid container spacing={3}>
                {tickets.map((ticket) => (
                  <Grid item xs={12} sm={6} md={4} key={ticket.ticketnumber}>
                    <Card
                      sx={{
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        "&:hover": {
                          boxShadow: 6,
                        },
                      }}
                      onClick={() => handleCardClick(ticket)}
                    >
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Ticket #{ticket.ticketnumber}
                        </Typography>
                        <Typography variant="body1">
                          {ticket.ticketSummary}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Priority: {ticket.priority}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Company: {ticket.company.CompanyName} (Acronym:{" "}
                          {ticket.company.Acronym})
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          Engagement Manager:{" "}
                          {ticket.company.PrimaryEngagementMgr}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle1">Technicians:</Typography>
                          {renderTechnicians(ticket.technicians)}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          ) : (
            <Typography variant="body1">No tickets found.</Typography>
          )}
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
