// ./components/TicketDialog.tsx
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  IconButton,
  Button,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import { Close } from "@mui/icons-material";
import ComputerIcon from "@mui/icons-material/Computer";
import TerminalIcon from "@mui/icons-material/Terminal";
import { Ticket, Note } from "../interfaces";
import EditableField from "./EditableField";
import NotesSection from "./NotesSection";
import RunScriptDialog from "./RunScriptDialog";
import * as api from "../api/client";

interface TicketDialogProps {
  ticket: Ticket;
  open: boolean;
  onClose: () => void;
  notes: Note[];
  currentUser: any;
}

const TicketDialog: React.FC<TicketDialogProps> = ({
  ticket,
  open,
  onClose,
  notes,
  currentUser,
}) => {
  const [title, setTitle] = useState(ticket.ticketTitle);
  const [priority, setPriority] = useState(ticket.priority);
  const [companyName, setCompanyName] = useState(ticket.company.CompanyName);
  const [sortAscending, setSortAscending] = useState(true);
  const [devices, setDevices] = useState<any[]>([]);
  const [scriptDevice, setScriptDevice] = useState<any | null>(null);

  // Load devices linked to this ticket (the cockpit: machines this ticket touches).
  useEffect(() => {
    if (!open || ticket.localId == null) return;
    api
      .listTicketDevices(ticket.localId)
      .then((d) => setDevices(d as any[]))
      .catch(() => setDevices([]));
  }, [open, ticket.localId]);

  // Persist edits to the backend (no-op if this ticket has no local id yet).
  const persist = async (data: Record<string, unknown>) => {
    if (ticket.localId == null) return;
    try {
      await api.updateTicket(ticket.localId, data);
    } catch (err) {
      console.error("Failed to save ticket edit:", err);
    }
  };

  const handleTitleSave = (newTitle: string) => {
    setTitle(newTitle);
    persist({ title: newTitle });
  };

  const handlePrioritySave = (newPriority: string) => {
    setPriority(newPriority);
    persist({ priority: newPriority });
  };

  const handleCompanySave = (newCompany: string) => {
    setCompanyName(newCompany);
    persist({ companyName: newCompany });
  };

  const canEditNote = (note: Note) => {
    return note.authorId === currentUser.id.toString();
  };

  const toggleSort = () => {
    setSortAscending(!sortAscending);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <Typography variant="h6">
          Ticket #{ticket.ticketnumber}: {title}
        </Typography>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ position: "absolute", right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {/* Ticket Details */}
        <EditableField
          label="Ticket Title"
          value={title}
          onSave={handleTitleSave}
        />
        <EditableField
          label="Priority"
          value={priority}
          options={["1", "2", "3", "4", "5", "6"]} // Provide priority options if needed
          onSave={handlePrioritySave}
        />
        <EditableField
          label="Company"
          value={companyName}
          onSave={handleCompanySave}
        />

        {/* Linked devices — the RMM cockpit on the ticket */}
        {devices.length > 0 && (
          <Box sx={{ my: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Devices</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {devices.map((d) => {
                const canRun = !!d.externalId && d.source !== "local" && d.source !== "netviz";
                return (
                  <Chip
                    key={d.id}
                    icon={<ComputerIcon />}
                    color={d.status === "online" ? "success" : "default"}
                    variant="outlined"
                    label={`${d.displayName || d.hostname || d.ipAddress || "device"}${d.ipAddress ? ` · ${d.ipAddress}` : ""}`}
                    onClick={canRun ? () => setScriptDevice(d) : undefined}
                    onDelete={canRun ? () => setScriptDevice(d) : undefined}
                    deleteIcon={canRun ? <TerminalIcon /> : undefined}
                  />
                );
              })}
            </Stack>
          </Box>
        )}

        {/* Notes Section */}
        <NotesSection
          notes={notes}
          sortAscending={sortAscending}
          toggleSort={toggleSort}
          canEditNote={canEditNote}
          currentUser={currentUser}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {scriptDevice && (
        <RunScriptDialog
          open={!!scriptDevice}
          onClose={() => setScriptDevice(null)}
          deviceId={scriptDevice.id}
          deviceName={scriptDevice.displayName || scriptDevice.hostname || `device ${scriptDevice.id}`}
          ticketId={ticket.localId}
        />
      )}
    </Dialog>
  );
};

export default TicketDialog;
