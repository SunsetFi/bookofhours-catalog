import * as React from "react";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import ListItemText from "@mui/material/ListItemText";

import { FilterComponentProps } from "./types";

export interface MultiselectOptionsFilterProps<T>
  extends FilterComponentProps<T[], T> {
  allowedValues: any[];
}

export function MultiselectOptionsFilter<T>({
  allowedValues,
  filterValue,
  onChange,
}: MultiselectOptionsFilterProps<T>) {
  if (filterValue == null) {
    filterValue = [];
  }
  const [search, setSearch] = React.useState<string>("");
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          px: 1,
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <Button size="small" onClick={() => onChange([])}>
          Clear
        </Button>
        <Button
          size="small"
          sx={{ pl: 1, ml: "auto" }}
          onClick={() => onChange(allowedValues)}
        >
          Select All
        </Button>
      </Box>
      <TextField
        sx={{ mx: 1, mt: 1 }}
        autoFocus
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <List sx={{ maxHeight: "600px", minHeight: 0, overflow: "auto" }}>
        {allowedValues
          .filter(
            (item) =>
              search === "" ||
              String(item).toLowerCase().includes(search.toLowerCase())
          )
          .map((value) => (
            <ListItem key={value} disablePadding>
              <ListItemButton
                dense
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  let newValue = filterValue!;
                  if (newValue.includes(value)) {
                    newValue = newValue.filter((x) => x !== value);
                  } else {
                    newValue = [...newValue, value];
                  }

                  if (newValue.length === 0) {
                    onChange(null);
                  } else {
                    onChange(newValue);
                  }
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={filterValue!.includes(value)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={value} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </Box>
  );
}
