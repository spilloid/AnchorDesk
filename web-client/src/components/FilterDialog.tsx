import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  TextField,
} from "@mui/material";
import { useState, useMemo } from "react";
import { Ticket } from "../interfaces";

interface FilterDialogProps {
  open: boolean;
  onClose: () => void;
  tickets: Ticket[];
  applyFilters: (filtered: Ticket[]) => void;
}

const FilterDialog: React.FC<FilterDialogProps> = ({
  open,
  onClose,
  tickets,
  applyFilters,
}) => {
  const [filter, setFilter] = useState({
    ticketnumber: "",
    ticketSummary: "",
    priority: "",
    status: "",
    technicianName: "",
    companyName: "",
    engagementManager: "",
    timeEntryFilter: "",
  });

  // Extract unique values for the Autocomplete options
  const uniquePriorities = useMemo(() => [...new Set(tickets.map((t) => t.priority))], [tickets]);
  const uniqueStatuses = useMemo(() => [...new Set(tickets.map((t) => t.status))], [tickets]);
  const uniqueCompanies = useMemo(() => [...new Set(tickets.map((t) => t.company.CompanyName))], [tickets]);
  const uniqueTechnicians = useMemo(() => [...new Set(tickets.map((t) =>
    t.technician ? `${t.technician.FirstName} ${t.technician.LastName}` : ''
  ))], [tickets]);
  const uniqueEngagementManagers = useMemo(() => [...new Set(tickets.map((t) => t.company.PrimaryEngagementMgr))], [tickets]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  const applyFilter = () => {
    const filtered = tickets.filter((ticket) => {
      try {
        const ticketNumberMatch = new RegExp(filter.ticketnumber, "i").test(ticket.ticketnumber.toString());
        const summaryMatch = new RegExp(filter.ticketSummary, "i").test(ticket.ticketSummary);
        const priorityMatch = new RegExp(filter.priority, "i").test(ticket.priority);
        const statusMatch = new RegExp(filter.status, "i").test(ticket.status);
        const technicianMatch = ticket.technician
          ? new RegExp(filter.technicianName, "i").test(`${ticket.technician.FirstName} ${ticket.technician.LastName}`)
          : false;
        const companyMatch = new RegExp(filter.companyName, "i").test(ticket.company.CompanyName);
        const engagementManagerMatch = new RegExp(filter.engagementManager, "i").test(ticket.company.PrimaryEngagementMgr);

        const timeEntryMatch =
          filter.timeEntryFilter === ""
            ? true
            : ticket.timeEntries?.some((entry) =>
                new RegExp(filter.timeEntryFilter, "i").test(`${entry.TimeStart} ${entry.TimeStop} ${entry.TimeNote}`)
              ) || false;

        return (
          ticketNumberMatch &&
          summaryMatch &&
          priorityMatch &&
          statusMatch &&
          technicianMatch &&
          companyMatch &&
          engagementManagerMatch &&
          timeEntryMatch
        );
      } catch (err) {
        console.error("Error applying filters: ", err);
        return false;
      }
    });

    applyFilters(filtered);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyFilter();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} onKeyPress={handleKeyPress}>
      <DialogTitle>Filter Tickets</DialogTitle>
      <DialogContent>
        <TextField
          margin="dense"
          name="ticketnumber"
          label="Ticket Number"
          fullWidth
          value={filter.ticketnumber}
          onChange={handleFilterChange}
        />
        <TextField
          margin="dense"
          name="ticketSummary"
          label="Ticket Summary"
          fullWidth
          value={filter.ticketSummary}
          onChange={handleFilterChange}
        />

        {/* Autocomplete for Priority */}
        <Autocomplete
          options={uniquePriorities}
          getOptionLabel={(option) => option}
          value={filter.priority}
          onChange={(e, value) => setFilter({ ...filter, priority: value || "" })}
          renderInput={(params) => <TextField {...params} label="Priority" fullWidth />}
        />

        {/* Autocomplete for Status */}
        <Autocomplete
          options={uniqueStatuses}
          getOptionLabel={(option) => option}
          value={filter.status}
          onChange={(e, value) => setFilter({ ...filter, status: value || "" })}
          renderInput={(params) => <TextField {...params} label="Status" fullWidth />}
        />

        {/* Autocomplete for Technician */}
        <Autocomplete
          options={uniqueTechnicians}
          getOptionLabel={(option) => option}
          value={filter.technicianName}
          onChange={(e, value) => setFilter({ ...filter, technicianName: value || "" })}
          renderInput={(params) => <TextField {...params} label="Technician Name" fullWidth />}
        />

        {/* Autocomplete for Company Name */}
        <Autocomplete
          options={uniqueCompanies}
          getOptionLabel={(option) => option}
          value={filter.companyName}
          onChange={(e, value) => setFilter({ ...filter, companyName: value || "" })}
          renderInput={(params) => <TextField {...params} label="Company Name" fullWidth />}
        />

        {/* Autocomplete for Engagement Manager */}
        <Autocomplete
          options={uniqueEngagementManagers}
          getOptionLabel={(option) => option}
          value={filter.engagementManager}
          onChange={(e, value) => setFilter({ ...filter, engagementManager: value || "" })}
          renderInput={(params) => <TextField {...params} label="Engagement Manager" fullWidth />}
        />

        <TextField
          margin="dense"
          name="timeEntryFilter"
          label="Time Entry Info"
          fullWidth
          value={filter.timeEntryFilter}
          onChange={handleFilterChange}
          helperText="Filter by time entry details like TimeStart, TimeStop, or Notes."
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={applyFilter} variant="contained" color="primary">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FilterDialog;
