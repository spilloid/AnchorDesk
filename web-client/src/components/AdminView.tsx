import { useEffect, useState } from "react";
import {
  Box,
  Tab,
  Tabs,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Switch,
  Button,
  Chip,
  TextField,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import * as api from "../api/client";

type AdminTab = "providers" | "probes" | "devices" | "mail";

/** Lean admin surface: sync providers, netviz probes, device inventory, mail config.
 *  Deliberately not a full CRUD cathedral — toggles, lists, and the few actions
 *  that have nowhere else to live. */
export default function AdminView() {
  const [tab, setTab] = useState<AdminTab>("providers");

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 1 }}>Admin</Typography>
      <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="Sync Providers" value="providers" />
        <Tab label="Probes" value="probes" />
        <Tab label="Devices" value="devices" />
        <Tab label="Mail" value="mail" />
      </Tabs>

      {tab === "providers" && <ProvidersPanel />}
      {tab === "probes" && <ProbesPanel />}
      {tab === "devices" && <DevicesPanel />}
      {tab === "mail" && <MailPanel />}
    </Box>
  );
}

function useAsync<T>(loader: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    setLoading(true);
    setError(null);
    loader()
      .then(setData)
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reload, deps);
  return { data, loading, error, reload };
}

function ProvidersPanel() {
  const { data, loading, error, reload } = useAsync(() => api.listSyncProviders() as Promise<any[]>);

  const toggle = async (id: number, enabled: boolean) => {
    await api.toggleSyncProvider(id, enabled);
    reload();
  };
  const run = async (name: string) => {
    await api.runSync(name);
    reload();
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Last Synced</TableCell>
            <TableCell>Enabled</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.name}</TableCell>
              <TableCell><Chip size="small" label={p.type} /></TableCell>
              <TableCell>{p.lastSyncedAt ? new Date(p.lastSyncedAt).toLocaleString() : "never"}</TableCell>
              <TableCell>
                <Switch checked={!!p.enabled} onChange={(e) => toggle(p.id, e.target.checked)} />
              </TableCell>
              <TableCell align="right">
                <Button size="small" disabled={!p.enabled} onClick={() => run(p.name)}>Sync now</Button>
              </TableCell>
            </TableRow>
          ))}
          {(data ?? []).length === 0 && (
            <TableRow><TableCell colSpan={5}>No sync providers configured.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

function ProbesPanel() {
  const { data, loading, error, reload } = useAsync(() => api.listProbes() as Promise<any[]>);
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [cidr, setCidr] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const create = async () => {
    if (!name) return;
    const probe = await api.createProbe({ name, companyName: company || undefined, cidr: cidr || undefined });
    setNewKey(probe.apiKey);
    setName(""); setCompany(""); setCidr("");
    reload();
  };

  const statusColor = (s: string) => (s === "online" ? "success" : s === "error" ? "error" : "default");

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Stack spacing={2}>
      {newKey && (
        <Alert severity="success" onClose={() => setNewKey(null)}>
          Probe API key (copy now — shown only once):{" "}
          <code style={{ wordBreak: "break-all" }}>{newKey}</code>
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>Register a netviz probe</Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <TextField size="small" label="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <TextField size="small" label="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
          <TextField size="small" label="CIDR" value={cidr} onChange={(e) => setCidr(e.target.value)} placeholder="192.168.1.0/24" />
          <Button variant="contained" onClick={create} disabled={!name}>Register</Button>
        </Stack>
      </Paper>

      <Paper variant="outlined">
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Company</TableCell>
              <TableCell>CIDR</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Seen</TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(data ?? []).map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.name}</TableCell>
                <TableCell>{p.companyName ?? "—"}</TableCell>
                <TableCell>{p.cidr ?? "—"}</TableCell>
                <TableCell><Chip size="small" color={statusColor(p.status) as any} label={p.status} /></TableCell>
                <TableCell>{p.lastSeenAt ? new Date(p.lastSeenAt).toLocaleString() : "never"}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={async () => { await api.deleteProbe(p.id); reload(); }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {(data ?? []).length === 0 && (
              <TableRow><TableCell colSpan={6}>No probes registered.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Stack>
  );
}

function DevicesPanel() {
  const { data, loading, error, reload } = useAsync(() => api.listDevices({ pageSize: 200 }) as Promise<any[]>);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const syncTactical = async () => {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const r = await api.syncDevices();
      setSyncMsg(`Synced from ${r.provider}: ${r.created} created, ${r.updated} updated` + (r.errors?.length ? `, ${r.errors.length} errors` : ""));
      reload();
    } catch (e) {
      setSyncMsg((e as Error).message);
    } finally {
      setSyncing(false);
    }
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Stack spacing={2}>
      <Box>
        <Button variant="contained" onClick={syncTactical} disabled={syncing}
          startIcon={syncing ? <CircularProgress size={16} /> : undefined}>
          Sync from Tactical RMM
        </Button>
        {syncMsg && <Alert severity="info" sx={{ mt: 1 }}>{syncMsg}</Alert>}
      </Box>
      <Paper variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Host / Name</TableCell>
            <TableCell>IP</TableCell>
            <TableCell>MAC</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Source</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Last Seen</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(data ?? []).map((d) => (
            <TableRow key={d.id}>
              <TableCell>{d.displayName || d.hostname || "—"}</TableCell>
              <TableCell>{d.ipAddress ?? "—"}</TableCell>
              <TableCell>{d.macAddress ?? "—"}</TableCell>
              <TableCell>{d.deviceType ?? "—"}</TableCell>
              <TableCell><Chip size="small" label={d.source} /></TableCell>
              <TableCell>
                <Chip size="small" color={d.status === "online" ? "success" : "default"} label={d.status} />
              </TableCell>
              <TableCell>{d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString() : "—"}</TableCell>
            </TableRow>
          ))}
          {(data ?? []).length === 0 && (
            <TableRow><TableCell colSpan={7}>No devices yet — register a probe, sync from Tactical, or add one manually.</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
      </Paper>
    </Stack>
  );
}

function MailPanel() {
  const { data, loading, error } = useAsync(() => api.getMailStatus());

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack spacing={1}>
        <Box>
          {data?.configured ? (
            <Chip color="success" label="SMTP configured" />
          ) : (
            <Chip color="warning" label="SMTP not configured" />
          )}
        </Box>
        <Typography variant="body2">Host: {data?.host ?? "—"}</Typography>
        <Typography variant="body2">Port: {data?.port}{data?.secure ? " (TLS)" : ""}</Typography>
        <Typography variant="body2">From: {data?.from}</Typography>
        <Alert severity="info" sx={{ mt: 1 }}>
          SMTP is configured via backend env vars (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM).
          Once set, tickets can send email and outbound messages are recorded on the ticket timeline.
        </Alert>
      </Stack>
    </Paper>
  );
}
