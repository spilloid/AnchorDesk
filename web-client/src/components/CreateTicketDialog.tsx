import { useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";
import * as api from "../api/client";

const STATUSES = ["New", "Reviewed", "Scheduled", "InProgress"];
const PRIORITIES = ["Low", "Medium", "High", "Critical"];

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateTicketDialog({ open, onClose, onCreated }: Props) {
  const [form, setForm] = useState({
    title: "",
    summary: "",
    description: "",
    status: "New",
    priority: "Medium",
    companyName: "",
    assignee: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.createTicket({ ...form, source: "local" });
      setForm({ title: "", summary: "", description: "", status: "New", priority: "Medium", companyName: "", assignee: "" });
      onCreated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>New Ticket</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
          <TextField label="Title *" value={form.title} onChange={set("title")} fullWidth autoFocus />
          <TextField label="Summary" value={form.summary} onChange={set("summary")} fullWidth />
          <TextField label="Description" value={form.description} onChange={set("description")} fullWidth multiline rows={4} />
          <Stack direction="row" spacing={2}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={form.status}
                label="Status"
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                {STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select
                value={form.priority}
                label="Priority"
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              >
                {PRIORITIES.map((p) => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Company" value={form.companyName} onChange={set("companyName")} fullWidth />
            <TextField label="Assignee" value={form.assignee} onChange={set("assignee")} fullWidth />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={saving}>
          {saving ? "Creating…" : "Create Ticket"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
