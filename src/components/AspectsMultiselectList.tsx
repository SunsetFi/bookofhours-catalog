import React from "react";
import { switchMap, map } from "rxjs";

import {
  Box,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  SxProps,
  TextField,
} from "@mui/material";

import { EmptyArray$, filterItemObservations } from "@/observables";

import { AspectModel, useAspects } from "@/services/sh-compendium";

import { useObservation } from "@/hooks/use-observation";
import { useDebounceCommitValue } from "@/hooks/use-debounce-value";
import { useValueObservation } from "@/hooks/use-value-observation";

import AspectIcon from "./Aspects/AspectIcon";

export interface AspectsMultiSelectListProps {
  sx?: SxProps;
  items: readonly string[];
  value: readonly string[];
  onChange(value: readonly string[]): void;
}

const EmptyArray = [] as const;

const AspectsMultiSelectList: React.FC<AspectsMultiSelectListProps> = ({
  sx,
  items,
  value,
  onChange,
}) => {
  const itemModels = useAspects(items);

  const [searchValue, setSearchValue] = React.useState("");
  const [searchInputValue, setSearchInputValue] =
    useDebounceCommitValue(setSearchValue);

  const toggleAspect = React.useCallback(
    (aspect: string) => {
      if (value.includes(aspect)) {
        onChange(value.filter((a) => a !== aspect));
      } else {
        onChange([...value, aspect]);
      }
    },
    [value, onChange]
  );

  const itemModels$ = useValueObservation(itemModels);
  const searchValue$ = useValueObservation(searchValue);
  const currentItemModels$ = React.useMemo(
    () =>
      searchValue$.pipe(
        switchMap((search) =>
          itemModels$.pipe(
            filterItemObservations((item) =>
              item.label$.pipe(
                map(
                  (label) =>
                    label?.toLowerCase().includes(search.toLowerCase()) ?? false
                )
              )
            )
          )
        )
      ),
    [itemModels$, searchValue$]
  );

  const currentItemModels = useObservation(currentItemModels$) ?? EmptyArray;

  const listItems = React.useMemo(
    () =>
      currentItemModels.map((aspect) => (
        <AspectsMultiSelectItem
          key={aspect.aspectId}
          aspect={aspect}
          selected={value.includes(aspect.aspectId)}
          onClick={() => toggleAspect(aspect.aspectId)}
        />
      )),
    [currentItemModels, value, toggleAspect]
  );

  return (
    <Stack sx={sx}>
      <Box sx={{ px: 1, pb: 1 }}>
        <TextField
          label="Search"
          variant="outlined"
          fullWidth
          value={searchInputValue}
          onChange={(e) => setSearchInputValue(e.target.value)}
        />
      </Box>
      <List
        sx={{ flex: "1 1 auto", overflowY: "auto", minHeight: 0 }}
        disablePadding
      >
        {listItems}
      </List>
    </Stack>
  );
};

interface AspectsMultiSelectItemProps {
  aspect: AspectModel;
  selected: boolean;
  onClick(): void;
}

const AspectsMultiSelectItem: React.FC<AspectsMultiSelectItemProps> = ({
  aspect,
  selected,
  onClick,
}) => {
  const id = React.useId();
  const label = useObservation(aspect.label$);

  if (!label) {
    return null;
  }

  return (
    <ListItem disablePadding>
      <ListItemButton role={undefined} onClick={onClick} dense>
        <ListItemIcon sx={{ minWidth: 0 }}>
          <Checkbox
            edge="start"
            checked={selected}
            tabIndex={-1}
            disableRipple
            inputProps={{ "aria-labelledby": id }}
          />
        </ListItemIcon>
        <ListItemText id={id} primary={label ?? aspect} />
        <AspectIcon aspectId={aspect.aspectId} />
      </ListItemButton>
    </ListItem>
  );
};

export default AspectsMultiSelectList;
