import * as React from "react";
import { Observable, map } from "rxjs";
import { pick, uniqBy } from "lodash";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import { mapArrayItemsCached, observeAll, useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-game";

import AspectsList from "./AspectsList";
import ElementStackDetails from "./ElementStackDetails";
import Popper from "@mui/material/Popper";

export interface ElementStackSelectFieldProps {
  label: string;
  fullWidth?: boolean;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  uniqueElementIds?: boolean;
  displayAspects?: readonly string[];
  value: ElementStackModel | null;
  onChange(value: ElementStackModel | null): void;
}

const ElementStackSelectField = ({
  label,
  fullWidth,
  elementStacks$,
  uniqueElementIds,
  displayAspects,
  value,
  onChange,
}: ElementStackSelectFieldProps) => {
  const id = React.useId();
  const elementStacks =
    useObservation(() => {
      let observable = elementStacks$;
      if (uniqueElementIds) {
        observable = observable.pipe(
          mapArrayItemsCached((elementStack) =>
            elementStack.elementId$.pipe(
              map((elementId) => ({ elementId, elementStack }))
            )
          ),
          observeAll(),
          map((pairs) =>
            uniqBy(pairs, (pair) => pair.elementId).map((x) => x.elementStack)
          )
        );
      }
      return observable;
    }, [elementStacks$, uniqueElementIds]) ?? [];

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
        <MenuItem value="">
          <Typography variant="body1" sx={{ height: "30px" }}>
            (None)
          </Typography>
        </MenuItem>
        {elementStacks.map((elementStack) => (
          <MenuItem key={elementStack.id} value={elementStack.id}>
            <ElementStackSelectItem
              elementStack={elementStack}
              displayAspects={displayAspects}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default ElementStackSelectField;

interface ElementStackSelectItemProps {
  elementStack: ElementStackModel;
  displayAspects?: readonly string[];
}

const ElementStackSelectItem = ({
  elementStack,
  displayAspects,
}: ElementStackSelectItemProps) => {
  const label = useObservation(elementStack.label$);
  let aspects = useObservation(elementStack.aspects$);

  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  if (!label || !aspects) {
    return null;
  }

  if (displayAspects) {
    aspects = pick(aspects, displayAspects);
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "row", gap: 1, width: "100%" }}>
      <Box
        sx={{ display: "flex", flexDirection: "row", gap: 2 }}
        onMouseOver={(e) => setAnchorEl(e.currentTarget)}
        onMouseOut={() => setAnchorEl(null)}
      >
        <img
          style={{ display: "block" }}
          src={elementStack.iconUrl}
          alt={label ?? ""}
          width={30}
          height={30}
        />
        <Typography variant="body1">{label}</Typography>
      </Box>
      <Box
        sx={{
          ml: "auto",
          display: "flex",
          flexDirection: "row",
          gap: 1,
        }}
      >
        <AspectsList aspects={aspects} iconSize={30} />
      </Box>
      <Popper
        anchorEl={anchorEl}
        open={anchorEl != null}
        sx={{
          // This is here because this is used in a modal
          // You would think that the new popper would order further on in the document from the portal, but nope.
          // FIXME: Fix ElementStackSelectField z order issues.
          // I hate z indexes so much...  This is a disgustingly high value, but Popper is using 1300 by default.
          zIndex: 2000,
        }}
      >
        <ElementStackDetails elementStack={elementStack} />
      </Popper>
    </Box>
  );
};
