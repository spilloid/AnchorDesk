import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Typography,
  Alert,
  CircularProgress,
  Box,
  Chip,
} from "@mui/material";
import * as api from "../api/client";

interface RunScriptDialogProps {
  open: boolean;
  onClose: () => void;
  deviceId: number;
  deviceName: string;
  ticketId?: number;
}

type Script = { id: number; name: string; shell?: string };

/** Run or schedule a script against a single device. Lean: pick script, optional
 *  args + schedule, fire, show the output (synchronous for run-now). */
export default function RunScriptDialog({ open, onClose, deviceId, deviceName, ticketId }: RunScriptDialogProps) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [script, setScript] = useState<string>("");
  const [args, setArgs] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    setError(null);
    api.listScripts().then(setScripts).catch((e) => setError((e as Error).message));
  }, [open]);

  const run = async () => {
    if (!script) return;
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      const job = await api.runDeviceScript(deviceId, {
        script,
        scriptName: scripts.find((s) => String(s.id) === script)?.name,
        args: args.trim() ? args.split(/\s+/) : undefined,
        ticketId,
        scheduledFor: scheduledFor || undefined,
      });
      setResult(job);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Run script on {deviceName}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            select
            label="Script"
            value={script}
            onChange={(e) => setScript(e.target.value)}
            fullWidth
            size="small"
          >
            {scripts.length === 0 && <MenuItem value="" disabled>No scripts available (RMM not configured?)</MenuItem>}
            {scripts.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>
                {s.name} {s.shell ? `(${s.shell})` : ""}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Arguments (space-separated)"
            value={args}
            onChange={(e) => setArgs(e.target.value)}
            fullWidth
            size="small"
          />

          <TextField
            label="Schedule for (optional)"
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            fullWidth
            size="small"
            InputLabelProps={{ shrink: true }}
            helperText="Leave blank to run immediately"
          />

          {result && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Result</Typography>
                <Chip
                  size="small"
                  color={result.status === "success" ? "success" : result.status === "queued" ? "info" : result.status === "error" ? "error" : "default"}
                  label={result.status}
                />
              </Stack>
              {result.status === "queued" ? (
                <Alert severity="info">Scheduled — it will run at the chosen time.</Alert>
              ) : (
                <TextField
                  value={result.output ?? ""}
                  multiline
                  minRows={3}
                  maxRows={14}
                  fullWidth
                  size="small"
                  InputProps={{ readOnly: true, sx: { fontFamily: "monospace", fontSize: 13 } }}
                />
              )}
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" onClick={run} disabled={!script || running} startIcon={running ? <CircularProgress size={16} /> : undefined}>
          {scheduledFor ? "Schedule" : "Run now"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
