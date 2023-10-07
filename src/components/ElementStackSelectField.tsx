import * as React from "react";
import { Observable, map } from "rxjs";
import { pick } from "lodash";

import Popper from "@mui/material/Popper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";

import { observeAll, useObservation } from "@/observables";

import { ElementStackModel } from "@/services/sh-game";

import AspectsList from "./AspectsList";
import ElementStackDetails from "./ElementStackDetails";
import ElementIcon from "./ElementIcon";

export interface ElementStackSelectFieldProps {
  label: string;
  fullWidth?: boolean;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  displayAspects?: readonly string[];
  value: ElementStackModel | null;
  onChange(value: ElementStackModel | null): void;
}

interface ElementStackAutocompleteItem {
  label: string | null;
  elementStack: ElementStackModel;
}

function observeElementAutocomplete(
  model: ElementStackModel
): Observable<ElementStackAutocompleteItem> {
  return model.label$.pipe(
    map((label) => ({
      label,
      elementStack: model,
    }))
  );
}

const ElementStackSelectField = ({
  label,
  fullWidth,
  elementStacks$,
  displayAspects,
  value,
  onChange,
}: ElementStackSelectFieldProps) => {
  let elementStacks =
    useObservation(
      () =>
        elementStacks$.pipe(
          map((items) => items.map(observeElementAutocomplete)),
          observeAll()
        ),
      [elementStacks$]
    ) ?? null;

  if (!elementStacks) {
    return <CircularProgress />;
  }

  elementStacks = elementStacks.filter((x) => x.label != null) ?? null;

  const selectedValue =
    elementStacks.find(({ elementStack }) => elementStack === value) ?? null;

  const selectedElementId = selectedValue?.elementStack.elementId ?? null;

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={elementStacks}
      autoHighlight
      getOptionLabel={(option) => option.label ?? ""}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <Box
                  sx={{
                    display: "flex",
                    height: "100%",
                    width: "30px",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {selectedElementId && (
                    <ElementIcon
                      maxWidth={30}
                      maxHeight={30}
                      elementId={selectedElementId}
                    />
                  )}
                </Box>
              </InputAdornment>
            ),
          }}
        />
      )}
      value={selectedValue}
      onChange={(_, value) => onChange(value?.elementStack ?? null)}
      renderOption={(props, option) => (
        <ElementStackSelectItem
          key={option.elementStack.id}
          props={props}
          displayAspects={displayAspects}
          {...option}
        />
      )}
    />
  );
};

export default ElementStackSelectField;

interface ElementStackSelectItemProps extends ElementStackAutocompleteItem {
  props: any;
  displayAspects?: readonly string[];
}

const ElementStackSelectItem = ({
  props,
  label,
  elementStack,
  displayAspects,
}: ElementStackSelectItemProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  let aspects = useObservation(elementStack.aspects$);
  const iconUrl = useObservation(elementStack.iconUrl$);

  if (!label || !aspects) {
    return null;
  }

  if (displayAspects) {
    aspects = pick(aspects, displayAspects);
  }

  return (
    <Box
      component="li"
      sx={{ display: "flex", flexDirection: "row", gap: 1, width: "100%" }}
      {...props}
    >
      <Box
        sx={{ display: "flex", flexDirection: "row", gap: 2 }}
        onMouseOver={(e) => setAnchorEl(e.currentTarget)}
        onMouseOut={() => setAnchorEl(null)}
      >
        <Box
          sx={{
            width: "30px",
            height: "30px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            loading="lazy"
            src={iconUrl}
            alt={label ?? ""}
            style={{
              display: "block",
              maxWidth: "30px",
              maxHeight: "30px",
            }}
          />
        </Box>
        {/* FIXME: Shrink this text to fit the aspects in.  Not working for some reason. */}
        <Typography
          variant="body1"
          sx={{ flex: "1 1", textOverflow: "ellipsis", minWidth: 0 }}
        >
          {label}
        </Typography>
      </Box>
      <Box
        sx={{
          ml: "auto",
          display: "flex",
          flexDirection: "row",
          gap: 1,
        }}
      >
        <AspectsList
          sx={{ flexWrap: "nowrap" }}
          aspects={aspects}
          iconSize={30}
        />
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
