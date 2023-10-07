import * as React from "react";
import { Aspects } from "secrethistories-api";
import { uniq, flatten, isEqual } from "lodash";
import { Row } from "@tanstack/react-table";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import AspectSelectionGrid from "@/components/AspectSelectionGrid";

import { FilterComponentProps } from "./types";

type FilterValue = {
  [key: string]: string | number;
  $mode: "any" | "all" | "none";
};

export function aspectsFilter(
  row: Row<any>,
  columnId: string,
  filterValue: FilterValue
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

const defaultFilterValue: FilterValue = {
  $mode: "any",
} as any;
export const AspectsFilter = ({
  allowedAspectIds,
  columnValues,
  filterValue,
  onChange,
}: FilterComponentProps<FilterValue, Aspects> & {
  allowedAspectIds: readonly string[] | "auto";
}) => {
  if (!filterValue) {
    filterValue = defaultFilterValue;
  }

  const matchMode = (filterValue as any)["$mode"] ?? "any";
  const aspects = Object.keys(filterValue).filter((k) => k !== "$mode");

  let choices: readonly string[] = [];
  if (allowedAspectIds === "auto") {
    choices = uniq(flatten(columnValues.map((x) => Object.keys(x))));
  } else {
    choices = allowedAspectIds;
  }

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
        onChange(null);
      } else {
        onChange(newFilter);
      }
    },
    [matchMode, onChange]
  );

  const onModeChanged = React.useCallback(
    (mode: "any" | "all" | "none") => {
      const newFilter = { ...filterValue, $mode: mode };
      if (isEqual(newFilter, defaultFilterValue)) {
        onChange(null);
      } else {
        onChange({
          ...filterValue,
          $mode: mode,
        });
      }
    },
    [onChange, filterValue]
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
