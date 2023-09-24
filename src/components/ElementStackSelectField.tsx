import * as React from "react";
import { Observable } from "rxjs";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import { useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-game";

import AspectsList from "./AspectsList";

export interface ElementStackSelectFieldProps {
  label: string;
  fullWidth?: boolean;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  value: ElementStackModel | null;
  onChange(value: ElementStackModel | null): void;
}

const ElementStackSelectField = ({
  label,
  fullWidth,
  elementStacks$,
  value,
  onChange,
}: ElementStackSelectFieldProps) => {
  const id = React.useId();
  const elementStacks = useObservation(elementStacks$) ?? [];

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel id={id + "-label"}>{label}</InputLabel>
      <Select
        labelId={id + "-label"}
        id={id}
        label={label}
        value={value?.id ?? ""}
        onChange={(e) =>
          onChange(elementStacks.find((es) => es.id === e.target.value) ?? null)
        }
      >
        <MenuItem value=""></MenuItem>
        {elementStacks.map((elementStack) => (
          <MenuItem key={elementStack.id} value={elementStack.id}>
            <ElementStackSelectItem elementStack={elementStack} />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ElementStackSelectField;

interface ElementStackSelectItemProps {
  elementStack: ElementStackModel;
}

const ElementStackSelectItem = ({
  elementStack,
}: ElementStackSelectItemProps) => {
  const label = useObservation(elementStack.label$);
  const aspects = useObservation(elementStack.aspects$);

  if (!label || !aspects) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <Typography variant="body1">{label}</Typography>
      <AspectsList aspects={aspects} />
    </Box>
  );
};
