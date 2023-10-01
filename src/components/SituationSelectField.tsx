import * as React from "react";
import { Observable, combineLatest, map } from "rxjs";
import { sortBy } from "lodash";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";

import { observeAll, useObservation } from "@/observables";

import { SituationModel } from "@/services/sh-game";

import AspectIcon from "./AspectIcon";

export interface SituationSelectFieldProps {
  label: string;
  fullWidth?: boolean;
  requireUnstarted?: boolean;
  situations$: Observable<readonly SituationModel[]>;
  value: SituationModel | null;
  onChange(value: SituationModel | null): void;
}

interface SituationAutocompleteItem {
  label: string | null;
  state: string;
  situation: SituationModel;
}

function observeSituationAutocomplete(
  model: SituationModel
): Observable<SituationAutocompleteItem> {
  return combineLatest([model.verbLabel$, model.state$]).pipe(
    map(([label, state]) => ({
      label,
      state,
      situation: model,
    }))
  );
}

const SituationSelectField = ({
  label,
  fullWidth,
  requireUnstarted,
  situations$,
  value,
  onChange,
}: SituationSelectFieldProps) => {
  let situations =
    useObservation(
      () =>
        situations$.pipe(
          map((items) => items.map(observeSituationAutocomplete)),
          observeAll()
        ),
      [situations$]
    ) ?? null;

  if (!situations) {
    return <CircularProgress />;
  }

  situations = situations.filter((x) => x.label !== null);

  const selectedValue = situations.find((x) => x.situation === value) ?? null;

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={situations}
      autoHighlight
      getOptionLabel={(option) => option.label ?? ""}
      getOptionDisabled={(option) =>
        requireUnstarted ? option.state !== "Unstarted" : false
      }
      renderInput={(params) => <TextField {...params} label={label} />}
      value={selectedValue}
      onChange={(_, value) => onChange(value?.situation ?? null)}
      renderOption={(props, option) => (
        <SituationSelectItem
          key={option.situation.id}
          props={props}
          {...option}
        />
      )}
    />
  );
};

export default SituationSelectField;

interface SituationSelectItemProps extends SituationAutocompleteItem {
  props: any;
}

const SituationSelectItem = ({
  props,
  label,
  situation,
}: SituationSelectItemProps) => {
  const hints = useObservation(situation.hints$);
  const recipeLabel = useObservation(situation.recipeLabel$);

  if (!label || !hints) {
    return null;
  }

  return (
    <Box
      component="li"
      sx={{ display: "flex", flexDirection: "row", gap: 1, width: "100%" }}
      {...props}
    >
      <Typography variant="body1">
        {label}
        {recipeLabel ? ` - ${recipeLabel}` : null}
      </Typography>
      <Box
        sx={{
          ml: "auto",
          display: "flex",
          flexDirection: "row",
          gap: 1,
        }}
      >
        {sortBy(hints, (x) => x).map((hint) => (
          <AspectIcon key={hint} aspectId={hint} size={30} />
        ))}
      </Box>
    </Box>
  );
};
