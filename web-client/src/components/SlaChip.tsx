import { useEffect, useState } from "react";
import { Chip, Tooltip } from "@mui/material";
import AccessTimeIcon from "@mui/icons-material/AccessTime";

/**
 * Reactive SLA indicator. Shows the soonest active deadline (response until the
 * first reply, then resolution) as a live countdown that recolors as it nears
 * and passes due. Renders nothing when no SLA applies or the ticket is closed.
 */
interface SlaChipProps {
  responseDueAt?: string | null;
  resolutionDueAt?: string | null;
  firstRespondedAt?: string | null;
  status?: string;
  size?: "small" | "medium";
}

const TERMINAL = ["Closed", "Resolved", "Completed", "Cancelled", "Deleted"];

function fmtDelta(ms: number): string {
  const abs = Math.abs(ms);
  const m = Math.round(abs / 60000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const min = m % 60;
  if (h < 24) return `${h}h${min ? ` ${min}m` : ""}`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h`;
}

export default function SlaChip({ responseDueAt, resolutionDueAt, firstRespondedAt, status, size = "small" }: SlaChipProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  if (status && TERMINAL.includes(status)) return null;

  // Active clock: response until the first reply lands, then resolution.
  const clock = !firstRespondedAt && responseDueAt
    ? { kind: "Response", due: responseDueAt }
    : resolutionDueAt
      ? { kind: "Resolution", due: resolutionDueAt }
      : null;
  if (!clock) return null;

  const remaining = new Date(clock.due).getTime() - now;
  const breached = remaining < 0;
  const warning = !breached && remaining < 60 * 60_000; // within an hour

  const color = breached ? "error" : warning ? "warning" : "success";
  const label = breached ? `${clock.kind} overdue ${fmtDelta(remaining)}` : `${clock.kind} ${fmtDelta(remaining)}`;
  const tip = `${clock.kind} SLA ${breached ? "breached" : "due"} ${new Date(clock.due).toLocaleString()}`;

  return (
    <Tooltip title={tip}>
      <Chip size={size} color={color} variant={breached ? "filled" : "outlined"} icon={<AccessTimeIcon />} label={label} />
    </Tooltip>
  );
}
