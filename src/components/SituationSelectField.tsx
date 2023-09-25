import * as React from "react";
import { Observable } from "rxjs";
import { sortBy } from "lodash";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import { useObservation } from "@/observables";

import { SituationModel } from "@/services/sh-game";

import AspectIcon from "./AspectIcon";

export interface SituationSelectFieldProps {
  label: string;
  fullWidth?: boolean;
  situations$: Observable<readonly SituationModel[]>;
  value: SituationModel | null;
  onChange(value: SituationModel | null): void;
}

const SituationSelectField = ({
  label,
  fullWidth,
  situations$,
  value,
  onChange,
}: SituationSelectFieldProps) => {
  const id = React.useId();
  const situations = useObservation(situations$) ?? [];

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel id={id + "-label"}>{label}</InputLabel>
      <Select
        labelId={id + "-label"}
        label={label}
        id={id}
        value={value?.id ?? ""}
        onChange={(e) =>
          onChange(situations.find((es) => es.id === e.target.value) ?? null)
        }
      >
        <MenuItem value=""></MenuItem>
        {situations.map((situation) => (
          <MenuItem key={situation.id} value={situation.id}>
            <SituationSelectItem situation={situation} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default SituationSelectField;

interface SituationSelectItemProps {
  situation: SituationModel;
}

const SituationSelectItem = ({ situation }: SituationSelectItemProps) => {
  const label = useObservation(situation.verbLabel$);
  const hints = useObservation(situation.hints$);

  if (!label || !hints) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 1, width: "100%" }}>
      <Typography variant="body1">{label}</Typography>
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
