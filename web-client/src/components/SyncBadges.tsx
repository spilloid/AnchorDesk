import { Chip, Stack } from "@mui/material";
import SyncIcon from "@mui/icons-material/Sync";
import EmailIcon from "@mui/icons-material/Email";
import type { Ticket } from "../interfaces";
import { SYNC_PROVIDER_LABELS, syncProvidersForTicket } from "../syncBadges";

interface SyncBadgesProps {
  ticket: Pick<Ticket, "source" | "externalProvider" | "externalId">;
  header?: boolean;
}

/**
 * Small decorator for a ticket's external provenance. Keeping this in one
 * component makes cards, the table, Kanban, and the dialog use the same labels.
 */
export default function SyncBadges({ ticket, header = false }: SyncBadgesProps) {
  const providers = syncProvidersForTicket(ticket);
  if (providers.length === 0) return null;

  return (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
      {providers.map((provider) => (
        <Chip
          key={provider}
          size="small"
          icon={provider === "imap" ? <EmailIcon /> : <SyncIcon />}
          label={SYNC_PROVIDER_LABELS[provider] ?? provider}
          variant={header ? "filled" : "outlined"}
          title={ticket.externalId ? `External ID: ${ticket.externalId}` : undefined}
          sx={
            header
              ? {
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "#fff",
                  "& .MuiChip-icon": { color: "#fff" },
                }
              : undefined
          }
        />
      ))}
    </Stack>
  );
}
