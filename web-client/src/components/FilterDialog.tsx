import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
  Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import * as api from "../api/client";
import { TICKET_STATUSES } from "../ticketVocab";
import type { TicketFilterCriteria } from "../App";

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  /** Current applied criteria (so the dialog reflects active filters). */
  value: TicketFilterCriteria;
  applyFilters: (criteria: TicketFilterCriteria) => void;
}

/**
 * Server-side ticket filters. Options come from canonical sources (status vocab,
 * the company + assignee lists) rather than the current page, so filtering is
 * correct regardless of which page is loaded.
 */
const FilterDialog: React.FC<FilterDialogProps> = ({ open, onClose, value, applyFilters }) => {
  const [status, setStatus] = useState(value.status ?? "");
  const [company, setCompany] = useState(value.company ?? "");
  const [assignee, setAssignee] = useState(value.assignee ?? "");
  const [labelId, setLabelId] = useState<number | "">(value.labelId ?? "");
  const [companies, setCompanies] = useState<string[]>([]);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [labels, setLabels] = useState<api.Label[]>([]);

  // Re-sync local fields whenever the dialog opens with the active criteria.
  useEffect(() => {
    if (!open) return;
    setStatus(value.status ?? "");
    setCompany(value.company ?? "");
    setAssignee(value.assignee ?? "");
    setLabelId(value.labelId ?? "");
    api.listCompanies().then((cs) => setCompanies(cs.map((c) => c.name))).catch(() => setCompanies([]));
    api.listAssignees().then((as) => setAssignees(as.map((a) => a.displayName || a.username))).catch(() => setAssignees([]));
    api.listLabels().then(setLabels).catch(() => setLabels([]));
  }, [open, value]);

  const apply = () => applyFilters({
    status: status || undefined,
    company: company || undefined,
    assignee: assignee || undefined,
    labelId: labelId === "" ? undefined : labelId,
  });
  const clear = () => { setStatus(""); setCompany(""); setAssignee(""); setLabelId(""); applyFilters({}); };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Filter tickets</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Autocomplete
            options={TICKET_STATUSES}
            value={status || null}
            onChange={(_e, v) => setStatus(v ?? "")}
            renderInput={(params) => <TextField {...params} label="Status" />}
          />
          <Autocomplete
            freeSolo
            options={companies}
            value={company || null}
            onChange={(_e, v) => setCompany(v ?? "")}
            onInputChange={(_e, v) => setCompany(v)}
            renderInput={(params) => <TextField {...params} label="Company" />}
          />
          <Autocomplete
            freeSolo
            options={assignees}
            value={assignee || null}
            onChange={(_e, v) => setAssignee(v ?? "")}
            onInputChange={(_e, v) => setAssignee(v)}
            renderInput={(params) => <TextField {...params} label="Assignee" />}
          />
          <Autocomplete
            options={labels}
            getOptionLabel={(l) => l.name}
            value={labels.find((l) => l.id === labelId) ?? null}
            onChange={(_e, v) => setLabelId(v ? v.id : "")}
            renderInput={(params) => <TextField {...params} label="Label" />}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={clear} color="inherit">Clear</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={apply} variant="contained">Apply</Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;
