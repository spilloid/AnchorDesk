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

  // Fetch tickets from DB2Rest API
  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/Tickets'); // Update with your DB2Rest endpoint
      if (!response.ok) {
        throw new Error('Failed to fetch tickets');
      }
      const data = await response.json();
      setTickets(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Start the async fetching process after the initial page render
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
        <Typography variant="body2">{`Note: ${entry.TimeNote?.toString('utf-8') || 'No Note'}`}</Typography>
        <Typography variant="body2">{`Technician: ${entry.Technician?.FirstName || 'N/A'} ${entry.Technician?.LastName || ''}`}</Typography>
      </Box>
    ));
  };
  

  return (
    <ThemeProvider theme={defaultTheme}>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <CssBaseline />
        <DashboardAppBar drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />
        <DashboardDrawer drawerOpen={drawerOpen} toggleDrawer={toggleDrawer} />

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
          <Toolbar /> {/* To offset the AppBar height */}
          <Card>
            <CardContent>
              <Typography variant="h5">Welcome to Your Dashboard</Typography>
              {error && (
                <Typography color="error">Error: {error.message}</Typography>
              )}
              {loading ? (
                <CircularProgress />
              ) : tickets.length > 0 ? (
                <>
                  <Typography variant="body1">
                    Total Tickets: {tickets.length}
                  </Typography>
                  {tickets.map((ticket) => (
                    <Card key={ticket.ticketnumber} sx={{ my: 2 }}>
                      <CardContent>
                        <Typography variant="h6">
                          Ticket #{ticket.ticketnumber} - {ticket.ticketSummary}
                        </Typography>
                        <Typography variant="body2">
                          Priority: {ticket.priority}
                        </Typography>
                        <Typography variant="body2">
                          Company: {ticket.company.CompanyName} (Acronym:{" "}
                          {ticket.company.Acronym})
                        </Typography>
                        <Typography variant="body2">
                          Engagement Manager:{" "}
                          {ticket.company.PrimaryEngagementMgr}
                        </Typography>
                        <Box sx={{ my: 1 }}>
                          <Typography variant="subtitle1">
                            Technicians:
                          </Typography>
                          {renderTechnicians(ticket.technicians)}
                        </Box>
                        <Box sx={{ my: 1 }}>
                          <Typography variant="subtitle1">Time Entries:</Typography>
                          {renderTimeEntries(ticket.timeEntries)}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </>
              ) : (
                <Typography variant="body1">No tickets found.</Typography>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default App;
