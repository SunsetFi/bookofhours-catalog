import * as React from "react";
import { uniq, flatten } from "lodash";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";

import AspectSelectionGrid from "@/components/AspectSelectionGrid";

import { FilterComponentProps, FilterDef } from "../types";

type FilterValue = {
  aspects: readonly string[];
  mode: "any" | "all" | "none";
};

export function aspectsPresenceFilter(
  allowedAspectIds: readonly string[] | "auto"
): FilterDef<readonly string[], FilterValue> {
  return {
    FilterComponent: (props) => (
      <AspectsPresenceFilter allowedAspectIds={allowedAspectIds} {...props} />
    ),
    filterValue(value: readonly string[], filter: FilterValue) {
      const mode = filter.mode;
      const aspects = filter.aspects;
      if (aspects.length === 0) {
        return true;
      }

      for (const aspect of aspects) {
        if (mode === "all") {
          if (!value.includes(aspect)) {
            return false;
          }
        } else if (mode === "any") {
          if (value.includes(aspect)) {
            return true;
          }
        } else if (mode === "none") {
          if (value.includes(aspect)) {
            return false;
          }
        }
      }

      return mode === "all" || mode === "none";
    },
    defaultFilterValue: { aspects: [], mode: "any" },
  };
}

const AspectsPresenceFilter = ({
  allowedAspectIds,
  columnValues,
  value,
  onChange,
}: FilterComponentProps<FilterValue, readonly string[]> & {
  allowedAspectIds: readonly string[] | "auto";
}) => {
  const matchMode = value.mode;
  const aspects = value.aspects;

  let choices: readonly string[] = [];
  if (allowedAspectIds === "auto") {
    choices = uniq(flatten(columnValues));
  } else {
    choices = allowedAspectIds;
  }

  const onAspectsChanged = React.useCallback(
    (selectedAspects: readonly string[]) => {
      onChange({
        aspects: selectedAspects,
        mode: matchMode,
      });
    },
    [matchMode, onChange]
  );

  const onModeChanged = React.useCallback(
    (mode: "any" | "all" | "none") => {
      onChange({
        ...value,
        mode,
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
      <AspectSelectionGrid
        sx={{ justifyContent: "center" }}
        items={choices}
        value={aspects}
        onChange={onAspectsChanged}
      />
      <RadioGroup
        sx={{ mt: 1, px: 1 }}
        row
        value={matchMode}
        onChange={(e) => onModeChanged(e.target.value as any)}
      >
        <FormControlLabel value="any" control={<Radio />} label="Any" />
        <FormControlLabel value="all" control={<Radio />} label="All" />
        <FormControlLabel value="none" control={<Radio />} label="None" />
      </RadioGroup>
      <Box
        sx={{
          mt: 1,
          px: 1,
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <Button
          size="small"
          sx={{ pl: 1, mr: "auto" }}
          onClick={() => onAspectsChanged(choices)}
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
