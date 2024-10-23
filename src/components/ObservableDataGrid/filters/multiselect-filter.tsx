import React from "react";

import { Row } from "@tanstack/react-table";

import {
  Box,
  TextField,
  Button,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Checkbox,
  ListItemText,
} from "@mui/material";

import { useDebounceCommitValue } from "@/hooks/use-debounce-value";

import { FilterComponentProps } from "./types";
import { isEqual } from "lodash";
import MultiValueFilterHeader from "./MultiValueFilterHeader";

export type MultiSelectFilterValue<T> = {
  values: T[];
  mode: "any" | "none";
};

export interface MultiselectOptionsFilterProps<T>
  extends FilterComponentProps<MultiSelectFilterValue<T>, T> {
  allowedValues: any[];
}

const defaultFilterValue: MultiSelectFilterValue<any> = {
  values: [],
  mode: "any",
};

export function multiSelectFilter(
  row: Row<any>,
  columnId: string,
  filterValue: MultiSelectFilterValue<any>
): boolean {
  if (!filterValue || filterValue.values.length === 0) {
    return true;
  }

  const currentValue = row.getValue(columnId) as string | number;
  switch (filterValue.mode) {
    case "any":
      return filterValue.values.includes(currentValue);
    case "none":
      return !filterValue.values.includes(currentValue);
  }

  return false;
}

export function MultiselectFilter<T>({
  allowedValues,
  filterValue,
  onChange,
}: MultiselectOptionsFilterProps<T>) {
  const [localValue, setLocalValue] = useDebounceCommitValue(onChange);

  // This nonsense is so null localValue is respected but undefined is delegated to filterValue.
  let currentValue = localValue;
  if (currentValue === undefined) {
    currentValue = filterValue;
  }
  if (currentValue == null) {
    currentValue = defaultFilterValue as any;
  }

  const mode = currentValue?.mode ?? "any";
  const desiredValues = currentValue?.values ?? [];

  const onModeChanged = React.useCallback(
    (mode: "any" | "none") => {
      const newFilter = {
        mode,
        values: desiredValues,
      };

      if (isEqual(newFilter, defaultFilterValue)) {
        setLocalValue(null);
      } else {
        setLocalValue(newFilter);
      }
    },
    [desiredValues, setLocalValue]
  );

  const onValuesChanged = React.useCallback(
    (values: T[]) => {
      const newFilter = {
        mode,
        values,
      };
      if (isEqual(newFilter, defaultFilterValue)) {
        setLocalValue(null);
      } else {
        setLocalValue(newFilter);
      }
    },
    [mode, setLocalValue]
  );

  const toggleValue = React.useCallback(
    (value: T) => {
      if (desiredValues.includes(value)) {
        onValuesChanged(desiredValues.filter((v) => v !== value));
      } else {
        onValuesChanged([...desiredValues, value]);
      }
    },
    [onValuesChanged, desiredValues]
  );

  const [search, setSearch] = React.useState<string>("");

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <MultiValueFilterHeader
        sx={{ pb: 1 }}
        mode={mode}
        onModeChange={onModeChanged}
        itemsSelected={desiredValues.length > 0}
        onClear={() => onValuesChanged([])}
        onSelectAll={() => onValuesChanged(allowedValues)}
      />
      <TextField
        sx={{ mx: 1, mt: 1 }}
        autoFocus
        label="Search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <List
        sx={{
          width: "300px",
          minHeight: 0,
          maxHeight: "600px",
          overflow: "auto",
        }}
      >
        {allowedValues
          .filter(
            (item) =>
              search === "" ||
              String(item).toLowerCase().includes(search.toLowerCase())
          )
          .map((value) => (
            <ListItem key={value} disablePadding>
              <ListItemButton dense onClick={() => toggleValue(value)}>
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={desiredValues.includes(value)}
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
