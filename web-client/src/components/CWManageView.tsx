import { Box, Button, Grid, Typography } from "@mui/material";

interface CWManageViewProps {
  fetchTickets: () => void; // Add fetchTickets as a prop
}

const CWManageView: React.FC<CWManageViewProps> = ({ fetchTickets }) => {
  const handleSyncAction = (action: string) => {
    console.log(`Executing action: ${action}`);
    if (action === "Force Sync Ticket") {
      fetchTickets(); // Trigger fetchTickets when "Force Sync Ticket" is clicked
    }
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        CW Manage API - Ticket Sync Controls
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <Button variant="contained" color="primary" fullWidth onClick={() => handleSyncAction("Sync All Tickets")}>
            Sync All Tickets
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button variant="contained" color="primary" fullWidth onClick={() => handleSyncAction("Sync New Tickets")}>
            Sync New Tickets
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button variant="contained" color="primary" fullWidth onClick={() => handleSyncAction("Sync Updated Tickets")}>
            Sync Updated Tickets
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button variant="contained" color="secondary" fullWidth onClick={() => handleSyncAction("Delete Sync History")}>
            Delete Sync History
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button variant="contained" color="secondary" fullWidth onClick={() => handleSyncAction("Force Sync Ticket")}>
            Force Sync Ticket
          </Button>
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <Button variant="contained" color="secondary" fullWidth onClick={() => handleSyncAction("View Sync Logs")}>
            View Sync Logs
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CWManageView;
