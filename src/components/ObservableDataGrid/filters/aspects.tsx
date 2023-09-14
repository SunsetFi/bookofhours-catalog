import * as React from "react";
import { Aspects } from "secrethistories-api";
import { uniq, flatten } from "lodash";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import AspectSelectionGrid from "@/components/AspectSelectionGrid";

import { FilterComponentProps, FilterDef } from "../types";

type FilterValue = {
  [key: string]: string | number;
  $mode: "any" | "all" | "none";
};

export function aspectsFilter(
  allowedAspectIds: readonly string[] | "auto"
): FilterDef<Aspects, FilterValue> {
  return {
    FilterComponent: (props) => (
      <AspectsFilter allowedAspectIds={allowedAspectIds} {...props} />
    ),
    filterValue(value: Aspects, filter: FilterValue) {
      const mode = filter.$mode;
      const aspects = Object.keys(filter).filter((x) => x !== "$mode");
      if (aspects.length === 0) {
        return true;
      }

      for (const aspect of aspects) {
        const required = filter[aspect] as number;

        if (mode === "all") {
          if (value[aspect] == null || value[aspect] < required) {
            return false;
          }
        } else if (mode === "any") {
          if (value[aspect] != null && value[aspect] >= required) {
            return true;
          }
        } else if (mode === "none") {
          if (value[aspect] != null && value[aspect] >= required) {
            return false;
          }
        }
      }

      return mode === "all" || mode === "none";
    },
    defaultFilterValue: { $mode: "any" } as any,
  };
}

const AspectsFilter = ({
  allowedAspectIds,
  columnValues,
  value,
  onChange,
}: FilterComponentProps<FilterValue, Aspects> & {
  allowedAspectIds: readonly string[] | "auto";
}) => {
  const matchMode = (value as any)["$mode"];
  const aspects = Object.keys(value).filter((k) => k !== "$mode");

  let choices: readonly string[] = [];
  if (allowedAspectIds === "auto") {
    choices = uniq(flatten(columnValues.map((x) => Object.keys(x))));
  } else {
    choices = allowedAspectIds;
  }

  const onAspectsChanged = React.useCallback(
    (selectedAspects: readonly string[]) => {
      onChange({
        ...selectedAspects.reduce((obj, key) => {
          obj[key] = 1;
          return obj;
        }, {} as Aspects),
        $mode: matchMode,
      });
    },
    [matchMode, onChange]
  );

  const onModeChanged = React.useCallback(
    (mode: "any" | "all" | "none") => {
      onChange({
        ...value,
        $mode: mode,
      });
    },
    [onChange, value]
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
        <Button size="small" onClick={() => onChange({ $mode: "any" })}>
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
