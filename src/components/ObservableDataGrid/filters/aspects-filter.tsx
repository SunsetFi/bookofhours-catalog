import React from "react";
import { Aspects } from "secrethistories-api";
import { uniq, flatten, isEqual } from "lodash";
import { Row } from "@tanstack/react-table";

import {
  Box,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
} from "@mui/material";

import { useDebounceCommitValue } from "@/hooks/use-debounce-value";

import AspectSelectionGrid from "../../Aspects/AspectSelectionGrid";

import { FilterComponentProps } from "./types";

type AspectsFilterValue = {
  [key: string]: string | number;
  $mode: "any" | "all" | "none";
};

/**
 * A filter function to check if the aspects of a column match the filter value.
 * @param row The row data.
 * @param columnId The id of the column to check.
 * @param filterValue The aspects filter value.
 * @returns True if the row matches the filter, false otherwise.
 */
export function aspectsFilter(
  row: Row<any>,
  columnId: string,
  filterValue: AspectsFilterValue
): boolean {
  if (!filterValue) {
    return true;
  }

  const mode = filterValue.$mode ?? "any";
  const desiredAspects = Object.keys(filterValue).filter((x) => x !== "$mode");
  if (desiredAspects.length === 0) {
    return true;
  }

  const valueAspects: Aspects = row.getValue(columnId) ?? {};

  for (const aspect of desiredAspects) {
    const required = filterValue[aspect] as number;

    if (mode === "all") {
      if (valueAspects[aspect] == null || valueAspects[aspect] < required) {
        return false;
      }
    } else if (mode === "any") {
      if (valueAspects[aspect] != null && valueAspects[aspect] >= required) {
        return true;
      }
    } else if (mode === "none") {
      if (valueAspects[aspect] != null && valueAspects[aspect] >= required) {
        return false;
      }
    }
  }

  return mode === "all" || mode === "none";
}

/**
 * A filter function to check if an aspect is present in any form in the column.
 * @param row The row data.
 * @param columnId The id of the column to check.
 * @param filterValue The aspects filter value.
 * @returns True if the row matches the filter, false otherwise.
 */
export function aspectsPresentFilter(
  row: Row<any>,
  columnId: string,
  filterValue: AspectsFilterValue
) {
  if (!filterValue) {
    return true;
  }

  const mode = filterValue.$mode ?? "any";
  const desiredAspects = Object.keys(filterValue).filter((x) => x !== "$mode");
  if (desiredAspects.length === 0) {
    return true;
  }

  const valueAspects: Aspects = row.getValue(columnId) ?? {};

  for (const aspect of desiredAspects) {
    // The filter component uses 0 and 1 for this currently.
    const required = Boolean(filterValue[aspect]);

    if (mode === "all") {
      if (valueAspects[aspect] === undefined && required) {
        return false;
      }
    } else if (mode === "any") {
      if (valueAspects[aspect] !== undefined && required) {
        return true;
      }
    } else if (mode === "none") {
      if (valueAspects[aspect] !== undefined && required) {
        return false;
      }
    }
  }

  return mode === "all" || mode === "none";
}

const defaultFilterValue: AspectsFilterValue = {
  $mode: "any",
} as any;
export const AspectsFilter = ({
  allowedAspectIds,
  columnValues,
  filterValue,
  onChange,
}: FilterComponentProps<AspectsFilterValue, Aspects> & {
  allowedAspectIds: readonly string[] | "auto";
}) => {
  let choices: readonly string[] = [];
  if (allowedAspectIds === "auto") {
    choices = uniq(flatten(columnValues.map((x) => Object.keys(x))));
  } else {
    choices = allowedAspectIds;
  }

  const [localValue, setLocalValue] = useDebounceCommitValue(700, onChange);

  // This nonsense is so null localValue is respected but undefined is delegated to filterValue.
  let currentValue = localValue;
  if (currentValue === undefined) {
    currentValue = filterValue;
  }
  if (currentValue == null) {
    currentValue = defaultFilterValue;
  }

  const matchMode = (currentValue as any)["$mode"] ?? "any";
  const aspects = Object.keys(currentValue).filter((k) => k !== "$mode");

  const onAspectsChanged = React.useCallback(
    (selectedAspects: readonly string[]) => {
      const newFilter = {
        ...selectedAspects.reduce((obj, key) => {
          obj[key] = 1;
          return obj;
        }, {} as Aspects),
        $mode: matchMode,
      };

      if (isEqual(newFilter, defaultFilterValue)) {
        setLocalValue(null);
      } else {
        setLocalValue(newFilter);
      }
    },
    [matchMode, setLocalValue]
  );

  const onModeChanged = React.useCallback(
    (mode: "any" | "all" | "none") => {
      const newFilter = { ...currentValue, $mode: mode };
      if (isEqual(newFilter, defaultFilterValue)) {
        setLocalValue(null);
      } else {
        setLocalValue({
          ...currentValue,
          $mode: mode,
        });
      }
    },
    [setLocalValue, currentValue]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 1,
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <Button size="small" onClick={() => onChange(null)}>
          Clear
        </Button>
        <Button
          size="small"
          sx={{ pl: 1, ml: "auto" }}
          onClick={() => onAspectsChanged(choices)}
        >
          Select All
        </Button>
      </Box>
      <AspectSelectionGrid
        sx={{ justifyContent: "center" }}
        items={choices}
        value={aspects}
        onChange={onAspectsChanged}
      />
      <RadioGroup
        sx={{ px: 1 }}
        row
        value={matchMode}
        onChange={(e) => onModeChanged(e.target.value as any)}
      >
        <FormControlLabel value="any" control={<Radio />} label="Any" />
        <FormControlLabel value="all" control={<Radio />} label="All" />
        <FormControlLabel value="none" control={<Radio />} label="None" />
      </RadioGroup>
    </Box>
  );
};
