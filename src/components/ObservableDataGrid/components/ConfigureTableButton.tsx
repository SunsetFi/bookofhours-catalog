import React from "react";

import {
  IconButton,
  Checkbox,
  Popover,
  Paper,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
} from "@mui/material";

import { Settings } from "@mui/icons-material";

import { Table } from "@tanstack/react-table";

export interface ConfigureTableButtonProps {
  table: Table<Record<string, any>>;
}
const ConfigureTableButton: React.FC<ConfigureTableButtonProps> = ({
  table,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  return (
    <>
      <IconButton
        aria-label="Configure Table"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        sx={{ p: 0 }}
      >
        <Settings />
      </IconButton>
      <ConfigureTableMenu
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        table={table}
      />
    </>
  );
};

export default ConfigureTableButton;

interface ConfigureTableMenuProps {
  anchorEl: HTMLElement | null;
  onClose(): void;
  table: Table<Record<string, any>>;
}

const ConfigureTableMenu: React.FC<ConfigureTableMenuProps> = ({
  anchorEl,
  onClose,
  table,
}) => {
  const columns = table.getAllColumns();
  const allVisible = columns.every((c) => c.getIsVisible());

  const toggleAllVisibility = React.useCallback(() => {
    table.setColumnVisibility(
      columns.reduce((acc, c) => {
        acc[c.id] = !allVisible;
        return acc;
      }, {} as Record<string, any>)
    );
  }, [columns, allVisible, table]);

  return (
    <Popover open={anchorEl != null} anchorEl={anchorEl} onClose={onClose}>
      <Paper sx={{ p: 1 }}>
        <Stack direction="column" alignItems="center">
          <Typography variant="h5">Column Visibility</Typography>
          <Button onClick={toggleAllVisibility}>
            {allVisible ? "Hide All" : "Show All"}
          </Button>
          <FormGroup>
            {columns
              // This can be functions, but im not sure how to invoke / resolve it.
              // The API docs for column visibility just use .header raw...
              .filter(
                (c) => typeof c.columnDef.header === "string" && c.getCanHide()
              )
              .map((column) => (
                <FormControlLabel
                  key={column.id}
                  control={
                    <Checkbox
                      checked={column.getIsVisible()}
                      onChange={column.getToggleVisibilityHandler()}
                    />
                  }
                  label={String(column.columnDef.header)}
                />
              ))}
          </FormGroup>
        </Stack>
      </Paper>
    </Popover>
  );
};
