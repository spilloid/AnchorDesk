import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Chip,
  Autocomplete,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import UndoIcon from "@mui/icons-material/Undo";

interface EditableFieldProps {
  label: string;
  value: string;
  options?: string[];
  color?: string;
  onSave: (newValue: string) => void;
}

const EditableField: React.FC<EditableFieldProps> = ({
  label,
  value,
  options,
  color,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableValue, setEditableValue] = useState(value);

  const handleSave = () => {
    onSave(editableValue);
    setIsEditing(false);
  };

  const handleRevert = () => {
    setEditableValue(value);
    setIsEditing(false);
  };

  return (
    <Box>
      <Typography variant="body1" gutterBottom>
        <strong>{label}:</strong>
      </Typography>
      {isEditing ? (
        <>
          {options ? (
            <Autocomplete
              options={options}
              value={editableValue}
              onChange={(_event, newValue) => {
                setEditableValue(newValue || "");
              }}
              renderInput={(params) => (
                <TextField {...params} variant="outlined" fullWidth />
              )}
            />
          ) : (
            <TextField
              variant="outlined"
              value={editableValue}
              onChange={(e) => setEditableValue(e.target.value)}
              fullWidth
            />
          )}
          <IconButton onClick={handleSave}>
            <SaveIcon />
          </IconButton>
          <IconButton onClick={handleRevert}>
            <UndoIcon />
          </IconButton>
        </>
      ) : (
        <>
          {color ? (
            <Chip
              label={value}
              sx={{
                backgroundColor: color,
                color: "#fff",
                fontWeight: "bold",
                mr: 1,
              }}
            />
          ) : (
            <Typography variant="body1" sx={{ display: "inline", mr: 1 }}>
              {value}
            </Typography>
          )}
          <IconButton onClick={() => setIsEditing(true)}>
            <EditIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
};

export default EditableField;
