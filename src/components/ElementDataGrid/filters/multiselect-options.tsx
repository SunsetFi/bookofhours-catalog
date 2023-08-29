import * as React from "react";

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
  return (
    <List sx={{ maxHeight: "600px" }}>
      {allowedValues.map((value) => (
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
  );
};
