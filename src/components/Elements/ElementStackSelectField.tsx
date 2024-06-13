import React from "react";
import { Observable, combineLatest, map } from "rxjs";
import { pick } from "lodash";
import { useDrop } from "react-dnd";

import Popper from "@mui/material/Popper";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";

import { observeAllMap } from "@/observables";

import { ElementStackDraggable } from "@/draggables/element-stack";

import { ElementStackModel } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import AspectsList from "../Aspects/AspectsList";

import ElementStackDetails from "./ElementStackDetails";
import ElementIcon from "./ElementIcon";

export interface ElementStackSelectFieldProps {
  label: string;
  fullWidth?: boolean;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  requireExterior?: boolean;
  displayAspects?: readonly string[];
  value: ElementStackModel | null;
  readOnly?: boolean;
  onChange(value: ElementStackModel | null): void;
}

interface ElementStackAutocompleteItem {
  label: string | null;
  elementStack: ElementStackModel;
  exterior: boolean;
}

function observeAutocompleteItem(
  model: ElementStackModel
): Observable<ElementStackAutocompleteItem> {
  return combineLatest([model.label$, model.inExteriorSphere$]).pipe(
    map(([label, exterior]) => ({
      label,
      elementStack: model,
      exterior,
    }))
  );
}

const ElementStackSelectField = ({
  label,
  fullWidth,
  elementStacks$,
  requireExterior = false,
  displayAspects,
  value,
  readOnly,
  onChange,
}: ElementStackSelectFieldProps) => {
  let items =
    useObservation(
      () => elementStacks$.pipe(observeAllMap(observeAutocompleteItem)),
      [elementStacks$]
    ) ?? null;

  const [{ canDrop, isOver, dropElementStack }, drop] = useDrop(
    () => ({
      accept: ElementStackDraggable,
      canDrop: (item: ElementStackDraggable) =>
        items?.some((x) => x.elementStack === item.elementStack) ?? false,
      drop: (item: ElementStackDraggable) => {
        if (items?.some((x) => x.elementStack === item.elementStack)) {
          onChange(item.elementStack);
        }
      },
      collect: (monitor) => ({
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver(),
        dropElementStack:
          monitor.getItem<ElementStackDraggable>()?.elementStack,
      }),
    }),
    [items]
  );

  if (!items) {
    return <CircularProgress />;
  }

  items = items.filter((x) => x.label != null) ?? null;

  let selectedValue =
    items.find(({ elementStack }) => elementStack === value) ?? null;

  if (canDrop && isOver && dropElementStack) {
    selectedValue =
      items.find(({ elementStack }) => elementStack === dropElementStack) ??
      null;
  }

  const selectedElementId = selectedValue?.elementStack.elementId ?? null;

  return (
    <Autocomplete
      fullWidth={fullWidth}
      options={items}
      readOnly={readOnly}
      autoHighlight
      getOptionLabel={(option) => option.label!}
      getOptionDisabled={(option) => requireExterior && !option.exterior}
      renderInput={(params) => (
        <TextField
          ref={drop}
          {...params}
          sx={{
            ["& .MuiOutlinedInput-root"]: {
              ["& fieldset"]: {
                ...(canDrop && {
                  borderColor: "primary.main",
                }),
              },
            },
          }}
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
