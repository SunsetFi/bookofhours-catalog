import React from "react";
import { Observable, combineLatest, map } from "rxjs";
import { pick } from "lodash";
import { useDrop } from "react-dnd";

import {
  Box,
  Typography,
  Autocomplete,
  TextField,
  CircularProgress,
  InputAdornment,
  SxProps,
  createFilterOptions,
  FilterOptionsState,
  Paper,
  Stack,
} from "@mui/material";

import { observeAllMap } from "@/observables";

import { ElementStackDraggable } from "@/draggables/element-stack";

import { ElementStackModel } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import AspectsList from "../Aspects/AspectsList";

import ElementStackDetails from "./ElementStackDetails";
import ElementIcon from "./ElementIcon";
import Tooltip from "../Tooltip";

export interface ElementStackSelectFieldProps {
  sx?: SxProps;
  label?: string;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
  elementStacks$: Observable<readonly ElementStackModel[]>;
  requireExterior?: boolean;
  displayAspects?: readonly string[];
  value: ElementStackModel | null;
  readOnly?: boolean;
  autoFocus?: boolean;
  onChange(value: ElementStackModel | null): void;
}

interface ElementStackAutocompleteItem {
  label: string | null;
  elementStack: ElementStackModel;
  exterior: boolean;
}

function observeAutocompleteItem(
  model: ElementStackModel,
): Observable<ElementStackAutocompleteItem> {
  return combineLatest([model.label$, model.inExteriorSphere$]).pipe(
    map(([label, exterior]) => ({
      label,
      elementStack: model,
      exterior,
    })),
  );
}

const defaultFilterOptions = createFilterOptions<ElementStackAutocompleteItem>(
  {},
);

const ElementStackSelectField = ({
  sx,
  label,
  helperText,
  fullWidth,
  elementStacks$,
  requireExterior = false,
  displayAspects,
  value,
  readOnly,
  autoFocus,
  onChange,
}: ElementStackSelectFieldProps) => {
  let items =
    useObservation(
      () => elementStacks$.pipe(observeAllMap(observeAutocompleteItem)),
      [elementStacks$],
    ) ?? null;

  const [{ canDrop, isOver, dropElementStack }, drop] = useDrop(
    () => ({
      accept: ElementStackDraggable,
      canDrop: (draggable: ElementStackDraggable) => {
        const item = items?.find(
          (x) => x.elementStack === draggable.elementStack,
        );
        if (!item) {
          return false;
        }

        if (requireExterior && !item.exterior) {
          return false;
        }

        return true;
      },
      drop: (item: ElementStackDraggable, monitor) => {
        if (!monitor.canDrop()) {
          return;
        }

        onChange(item.elementStack);
      },
      collect: (monitor) => ({
        canDrop: monitor.canDrop(),
        isOver: monitor.isOver(),
        dropElementStack:
          monitor.getItem<ElementStackDraggable>()?.elementStack,
      }),
    }),
    [items, requireExterior],
  );

  const [matchCount, setMatchCount] = React.useState(0);
  const filterOptions = React.useCallback(
    (
      options: ElementStackAutocompleteItem[],
      state: FilterOptionsState<ElementStackAutocompleteItem>,
    ) => {
      const result = defaultFilterOptions(options, state);
      setMatchCount(result.length);
      return result.slice(0, 24);
    },
    [],
  );

  const PaperComponent = React.useMemo(
    () =>
      ({ children }: React.HTMLAttributes<HTMLElement>) => (
        <Paper>
          {children}
          {matchCount > 25 && (
            <Stack sx={{ width: "100%", p: 1 }} alignItems="center">
              <Typography
                sx={{ mx: "auto" }}
                textAlign="center"
                variant="caption"
              >
                Showing 25 of {matchCount} matching cards. Use search to refine
                the results.
              </Typography>
            </Stack>
          )}
        </Paper>
      ),
    [matchCount, items],
  );

  if (!items) {
    return <CircularProgress color="inherit" />;
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
      sx={sx}
      fullWidth={fullWidth}
      options={items}
      filterOptions={filterOptions}
      readOnly={readOnly}
      autoHighlight
      getOptionLabel={(option) => option.label!}
      getOptionDisabled={(option) => requireExterior && !option.exterior}
      value={selectedValue}
      onChange={(_, value) => onChange(value?.elementStack ?? null)}
      slotProps={{
        // Neither of these have titles, and NVDA reads both.
        // Not sure about other screen readers
        clearIndicator: { "aria-label": "" },
        popupIndicator: { "aria-label": "" },
      }}
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
          autoFocus={autoFocus}
          label={label}
          slotProps={{
            // Hack: Orchestration slots need to put divs in helperText, and FormHelperText defaults to a p tag
            // FIXME: We should accept the requirements data ourselves and render it in a standard way
            // rather than having it passed in as helperText.
            // This would be useful to reuse for unlock dialog.
            formHelperText: { component: "div" },
            input: {
              ...params.InputProps,
              startAdornment: (
                <InputAdornment position="start" aria-hidden="true">
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
            },
          }}
          helperText={helperText}
        />
      )}
      renderOption={(props, option) => (
        <ElementStackSelectItem
          key={option.elementStack.id}
          props={props}
          displayAspects={displayAspects}
          {...option}
        />
      )}
      PaperComponent={PaperComponent}
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
  let aspects = useObservation(elementStack.aspects$);
  const iconUrl = useObservation(elementStack.iconUrl$);

  if (!label || !aspects) {
    return null;
  }

  if (displayAspects) {
    aspects = pick(aspects, displayAspects);
  }

  return (
    <Box component="li" sx={{ width: "100%" }} {...props}>
      <Tooltip
        sx={{ display: "flex", flexDirection: "row", gap: 1, width: "100%" }}
        title={<ElementStackDetails elementStack={elementStack} />}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            alignItems: "center",
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              aria-hidden="true"
              loading="lazy"
              src={iconUrl}
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
      </Tooltip>
    </Box>
  );
};
