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

import { useDebounceCommitValue } from "@/hooks/use-debounce-value";

import { FilterComponentProps } from "./types";

export interface MultiselectOptionsFilterProps<T>
  extends FilterComponentProps<T[], T> {
  allowedValues: any[];
}

const defaultFilterValue: any[] = [];

export function MultiselectOptionsFilter<T>({
  allowedValues,
  filterValue,
  onChange,
}: MultiselectOptionsFilterProps<T>) {
  const [localValue, setLocalValue] = useDebounceCommitValue(1000, onChange);

  // This nonsense is so null localValue is respected but undefined is delegated to filterValue.
  let currentValue = localValue;
  if (currentValue === undefined) {
    currentValue = filterValue;
  }
  if (currentValue == null) {
    currentValue = defaultFilterValue as any;
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
          pt: 1,
          px: 1,
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <Button size="small" onClick={() => setLocalValue(null)}>
          Clear
        </Button>
        <Button
          size="small"
          sx={{ pl: 1, ml: "auto" }}
          onClick={() => setLocalValue(allowedValues)}
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

                  let newValue = currentValue!;
                  if (newValue.includes(value)) {
                    newValue = newValue.filter((x) => x !== value);
                  } else {
                    newValue = [...newValue, value];
                  }

                  if (newValue.length === 0) {
                    setLocalValue(null);
                  } else {
                    setLocalValue(newValue);
                  }
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={currentValue!.includes(value)}
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
