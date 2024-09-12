import { Drawer, List, ListItem, ListItemText, ListItemIcon } from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import SyncIcon from "@mui/icons-material/Sync";
import PersonIcon from "@mui/icons-material/Person"; // New icon for "My Tickets"
import { Divider, Toolbar } from "@mui/material";

interface DashboardDrawerProps {
  drawerOpen: boolean;
  toggleDrawer: () => void;
  switchToView: (view: "tickets" | "myTickets" | "cwManage") => void; // Added "myTickets"
}

const DashboardDrawer: React.FC<DashboardDrawerProps> = ({ drawerOpen, toggleDrawer, switchToView }) => {
  return (
    <Drawer variant="persistent" anchor="left" open={drawerOpen}>
      <Toolbar /> {/* This will help offset the AppBar height */}
      <Divider />
      <List>
        <ListItem button onClick={() => switchToView("tickets")}>
          <ListItemIcon>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Tickets" />
        </ListItem>
        {/* Add "My Tickets" below "Tickets" */}
        <ListItem button onClick={() => switchToView("myTickets")}>
          <ListItemIcon>
            <PersonIcon />
          </ListItemIcon>
          <ListItemText primary="My Tickets" />
        </ListItem>
        <ListItem button onClick={() => switchToView("cwManage")}>
          <ListItemIcon>
            <SyncIcon />
          </ListItemIcon>
          <ListItemText primary="CW Manage" />
        </ListItem>
      </List>
    </Drawer>
  );
};

export default DashboardDrawer;
