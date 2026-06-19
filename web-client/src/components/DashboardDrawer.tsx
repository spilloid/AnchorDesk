import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import SyncIcon from "@mui/icons-material/Sync";
import SettingsIcon from "@mui/icons-material/Settings";

type ViewMode = "cards" | "table" | "kanban" | "sync" | "admin";

interface DashboardDrawerProps {
  drawerOpen: boolean;
  toggleDrawer: () => void;
  setViewMode: (viewMode: ViewMode) => void;
}

export default function DashboardDrawer({ drawerOpen, toggleDrawer, setViewMode }: DashboardDrawerProps) {
  const nav = (mode: ViewMode) => () => {
    setViewMode(mode);
    toggleDrawer();
  };

  return (
    <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
      <List sx={{ width: 220 }}>
        <ListItem button onClick={nav("cards")}>
          <ListItemIcon><HomeIcon /></ListItemIcon>
          <ListItemText primary="Card View" />
        </ListItem>

        <ListItem button onClick={nav("table")}>
          <ListItemIcon><ListAltIcon /></ListItemIcon>
          <ListItemText primary="Table View" />
        </ListItem>

        <ListItem button onClick={nav("kanban")}>
          <ListItemIcon><ViewKanbanIcon /></ListItemIcon>
          <ListItemText primary="Kanban Board" />
        </ListItem>

        <Divider sx={{ my: 1 }} />

        <ListItem button onClick={nav("sync")}>
          <ListItemIcon><SyncIcon /></ListItemIcon>
          <ListItemText primary="Sync Management" />
        </ListItem>

        <ListItem button onClick={nav("admin")}>
          <ListItemIcon><SettingsIcon /></ListItemIcon>
          <ListItemText primary="Admin" />
        </ListItem>
      </List>
    </Drawer>
  );
}
