import { useState, useEffect } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import * as api from "../api/client";

interface AuditEntry {
  id: string;
  entityType: string;
  entityId: number;
  action: string;
  changedBy: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  occurredAt: string;
}

interface Props {
  ticketId: number;
}

const ACTION_COLORS: Record<string, "success" | "warning" | "error" | "info" | "default"> = {
  create: "success",
  update: "info",
  delete: "error",
  sync: "warning",
};

/** Show which fields changed between old and new snapshots. */
function DiffSummary({ oldVal, newVal }: { oldVal: Record<string, unknown> | null; newVal: Record<string, unknown> | null }) {
  if (!oldVal && !newVal) return null;

  const SKIP = new Set(["updatedAt", "updated_at"]);
  const changed: { field: string; from: unknown; to: unknown }[] = [];

  const allKeys = new Set([...Object.keys(oldVal ?? {}), ...Object.keys(newVal ?? {})]);
  for (const key of allKeys) {
    if (SKIP.has(key)) continue;
    const before = oldVal?.[key];
    const after = newVal?.[key];
    if (JSON.stringify(before) !== JSON.stringify(after)) {
      changed.push({ field: key, from: before, to: after });
    }
  }

  if (changed.length === 0) return <Typography variant="body2" color="text.secondary">No field changes</Typography>;

  return (
    <Stack spacing={0.5}>
      {changed.map(({ field, from, to }) => (
        <Typography key={field} variant="body2">
          <strong>{field}:</strong>{" "}
          <span style={{ color: "#d32f2f", textDecoration: "line-through" }}>
            {from === undefined ? "—" : JSON.stringify(from)}
          </span>
          {" → "}
          <span style={{ color: "#2e7d32" }}>
            {to === undefined ? "—" : JSON.stringify(to)}
          </span>
        </Typography>
      ))}
    </Stack>
  );
}

export default function TicketHistory({ ticketId }: Props) {
  const [history, setHistory] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTicketHistory(ticketId)
      .then((data) => setHistory(data as AuditEntry[]))
      .finally(() => setLoading(false));
  }, [ticketId]);

  if (loading) return <CircularProgress size={24} sx={{ m: 2 }} />;

  if (history.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ mt: 2 }}>
        No history recorded yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom fontWeight={600}>
        Revision History
      </Typography>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>When</TableCell>
              <TableCell>Action</TableCell>
              <TableCell>By</TableCell>
              <TableCell>Changes</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((entry) => (
              <TableRow key={entry.id} sx={{ verticalAlign: "top" }}>
                <TableCell>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {new Date(entry.occurredAt).toLocaleString()}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={entry.action}
                    size="small"
                    color={ACTION_COLORS[entry.action] ?? "default"}
                    variant="outlined"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: 11 }}>
                    {entry.changedBy ?? "—"}
                  </Typography>
                </TableCell>
                <TableCell>
                  <DiffSummary oldVal={entry.oldValue} newVal={entry.newValue} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
