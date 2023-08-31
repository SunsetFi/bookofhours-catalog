import * as React from "react";
import { Aspects } from "secrethistories-api";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import AspectSelectionGrid from "@/components/AspectSelectionGrid";

import { FilterComponentProps, FilterDef } from "../types";

type FilterValue = { [key: string]: string | number; $mode: "any" | "all" };

export function aspectsFilter(
  allowedAspectIds: readonly string[]
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
        } else {
          if (value[aspect] != null && value[aspect] >= required) {
            return true;
          }
        }
      }

      return mode === "all" ? true : false;
    },
    defaultFilterValue: { $mode: "any" } as any,
  };
}

const AspectsFilter = ({
  allowedAspectIds,
  value,
  onChange,
}: FilterComponentProps<FilterValue> & {
  allowedAspectIds: readonly string[];
}) => {
  const matchMode = (value as any)["$mode"];
  const aspects = Object.keys(value).filter((k) => k !== "$mode");

  const onAspectsChanged = React.useCallback(
    (aspects: readonly string[]) => {
      onChange({
        ...aspects.reduce((obj, key) => {
          obj[key] = 1;
          return obj;
        }, {} as Aspects),
        $mode: matchMode,
      });
    },
    [matchMode, onChange]
  );

  const onModeChanged = React.useCallback(
    (mode: "any" | "all") => {
      onChange({
        ...value,
        $mode: mode,
      });
    },
    [onChange, value]
  );

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <AspectSelectionGrid
        sx={{ m: 1 }}
        items={allowedAspectIds}
        value={aspects}
        onChange={onAspectsChanged}
      />
      <RadioGroup
        row
        value={matchMode}
        onChange={(e) => onModeChanged(e.target.value as any)}
      >
        <FormControlLabel value="any" control={<Radio />} label="Any" />
        <FormControlLabel value="all" control={<Radio />} label="All" />
      </RadioGroup>
      <Box sx={{ m: 1, display: "flex", flexDirection: "row", width: "100%" }}>
        <Button
          size="small"
          sx={{ pl: 1, mr: "auto" }}
          onClick={() => onAspectsChanged(allowedAspectIds)}
        >
          Select All
        </Button>
        <Button size="small" onClick={() => onAspectsChanged([])}>
          Clear
        </Button>
      </Box>
    </Box>
  );
};
