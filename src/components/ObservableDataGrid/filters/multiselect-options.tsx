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

import { FilterComponentProps, FilterDef } from "../types";

export function multiselectOptionsFilter<TValue>(
  options: TValue[]
): FilterDef<TValue, TValue[]> {
  return {
    FilterComponent: (props) => (
      <MultiselectOptionsFilter allowedValues={options} {...props} />
    ),
    filterValue(value, filter) {
      if (filter.length === 0) {
        return true;
      }

      return filter.includes(value);
    },
    defaultFilterValue: [],
  };
}

interface MultiselectOptionsFilterProps extends FilterComponentProps<any[]> {
  allowedValues: any[];
}
const MultiselectOptionsFilter = ({
  allowedValues,
  value: selectedValues,
  onChange,
}: MultiselectOptionsFilterProps) => {
  const [search, setSearch] = React.useState<string>("");
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
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

                  let newValue = selectedValues;
                  if (newValue.includes(value)) {
                    newValue = newValue.filter((x) => x !== value);
                  } else {
                    newValue = [...newValue, value];
                  }

                  onChange(newValue);
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedValues.includes(value)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={value} />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
      <Box sx={{ display: "flex", flexDirection: "row", px: 1, pb: 1 }}>
        <Button onClick={() => onChange(allowedValues)}>Select All</Button>
        <Button sx={{ ml: "auto" }} onClick={() => onChange([])}>
          Clear
        </Button>
      </Box>
    </Box>
  );
};
