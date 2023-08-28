import * as React from "react";
import {
  Observable,
  combineLatest,
  of as observableOf,
  map,
  mergeMap,
} from "rxjs";
import { uniq } from "lodash";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";

import { DataGrid } from "@mui/x-data-grid/DataGrid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";

import FilterAlt from "@mui/icons-material/FilterAlt";

import { mapItems, observeAll, useObservation } from "@/observables";
import { useDIDependency } from "@/container";

import { ElementStackModel, GameModel } from "@/services/sh-monitor";
import { API } from "@/services/sh-api";
import { filterHasAspect } from "@/services/sh-monitor/observables";

import { RequireLegacy } from "@/components/RequireLegacy";
import {
  useContextState,
  useContextStateSetter,
} from "@/hooks/use-context-state";
import Popover from "@mui/material/Popover";
import ListItemText from "@mui/material/ListItemText";

interface TableBookItem {
  id: string;
  iconUrl: string;
  label: string;
  description: string;
  location: string | null;
  mastery: {
    aspect: string;
    value: number;
    iconUrl: string;
  } | null;
}

const renderCellTextWrap = ({ value }: GridRenderCellParams<TableBookItem>) => (
  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
    <Typography
      variant="body2"
      sx={{
        width: "100%",
        height: "100%",
        whiteSpace: "break-spaces",
      }}
    >
      {value}
    </Typography>
  </Box>
);

const TableBookFilters = "tableBookFilters";
interface TableBookFilters {
  locations: string[];
}

function elementStackToItem(
  api: API,
  elementStack: ElementStackModel
): Observable<TableBookItem> {
  const parentTerrainLabel$ = elementStack.parentTerrain$.pipe(
    mergeMap((terrain) => terrain?.label$ ?? observableOf(null))
  );
  return combineLatest([
    elementStack.label$,
    elementStack.description$,
    parentTerrainLabel$,
    elementStack.elementAspects$,
  ]).pipe(
    map(([label, description, location, aspects]) => {
      const masteryKey = Object.keys(aspects).find((x) =>
        x.startsWith("mystery.")
      );

      return {
        id: elementStack.id,
        iconUrl: elementStack.iconUrl,
        label,
        description,
        location,
        mastery:
          masteryKey == null
            ? null
            : {
                aspect: masteryKey,
                value: aspects[masteryKey],
                // FIXME: Get this from a model.
                iconUrl: `${api.baseUrl}/api/compendium/elements/${masteryKey}/icon.png`,
              },
      };
    })
  );
}

const pageSizeOptions = [10, 25, 50];

const BookCatalog = () => {
  const api = useDIDependency(API);
  const model = useDIDependency(GameModel);

  const [filters, FilterProvider] = useContextState<TableBookFilters>(
    TableBookFilters,
    { locations: [] }
  );

  const rows =
    useObservation(
      () =>
        model.visibleElementStacks$.pipe(
          filterHasAspect("readable"),
          mapItems((element) => elementStackToItem(api, element)),
          observeAll()
        ),
      []
    ) ?? [];

  const filteredRows = React.useMemo(
    () =>
      rows.filter((row) => {
        if (filters.locations.length === 0) {
          return true;
        }

        return filters.locations.includes(row.location ?? "");
      }),
    [rows, filters]
  );

  const allRooms = React.useMemo(
    () => uniq(rows.map((x) => x.location ?? "")).sort(),
    [rows]
  );

  const columns = React.useMemo<GridColDef<TableBookItem>[]>(
    () => [
      {
        field: "iconUrl",
        headerName: "Icon",
        width: 90,
        sortable: false,
        disableColumnMenu: true,
        disableExport: true,
        disableReorder: true,
        renderCell: ({ value }) => (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              p: 2,
            }}
          >
            <img src={value} style={{ maxWidth: "75px", maxHeight: "75px" }} />
          </Box>
        ),
      },
      {
        field: "label",
        headerName: "Name",
        width: 200,
        renderCell: renderCellTextWrap,
      },
      {
        field: "location",
        headerName: "Location",
        width: 170,
        renderHeader: () => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 2,
            }}
          >
            <Typography variant="body2" component="span">
              Location
            </Typography>
            <FilterListButton filterKey="locations" allowedValues={allRooms} />
          </Box>
        ),
        renderCell: renderCellTextWrap,
      },
      {
        field: "mastery",
        headerName: "Mastery",
        width: 150,
        sortComparator: (
          v1: TableBookItem["mastery"],
          v2: TableBookItem["mastery"]
        ) => {
          if (v1 == null) {
            return -1;
          }

          if (v2 == null) {
            return 1;
          }

          return v1.value - v2.value;
        },
        renderCell: ({ value }) => {
          if (value == null) {
            return null;
          }

          return (
            <Box
              component="span"
              sx={{
                display: "flex",
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <img style={{ width: "50px" }} src={value.iconUrl} />
              <Typography
                style={{ whiteSpace: "nowrap" }}
                component="span"
                variant="h4"
                color="text.secondary"
              >
                {value.value}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "description",
        headerName: "Description",
        flex: 2,
        renderCell: renderCellTextWrap,
      },
    ],
    [allRooms]
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
      }}
    >
      <RequireLegacy />
      <Typography
        variant="h4"
        sx={{ py: 2, width: "100%", textAlign: "center" }}
      >
        The Collected Works of Hush House
      </Typography>
      <Box
        sx={{ width: "100%", height: "100%", minHeight: 0, overflow: "hidden" }}
      >
        <FilterProvider>
          <DataGrid
            columns={columns}
            rows={filteredRows}
            rowHeight={100}
            density="comfortable"
            initialState={{
              pagination: { paginationModel: { pageSize: pageSizeOptions[2] } },
            }}
            pageSizeOptions={pageSizeOptions}
            // Virtualization is causing scrolling to be all kinds of jank.
            disableVirtualization
          />
        </FilterProvider>
      </Box>
    </Box>
  );
};

interface FilterListButtonProps {
  filterKey: keyof TableBookFilters;
  allowedValues: string[];
}

const FilterListButton = ({
  filterKey,
  allowedValues,
}: FilterListButtonProps) => {
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);
  const [selectedValues, setSelectedValues] = React.useState<string[]>([]);
  const filterSet = useContextStateSetter<TableBookFilters>(TableBookFilters);
  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setAnchorEl(e.currentTarget);
        }}
      >
        <FilterAlt />
      </IconButton>
      <Popover
        open={anchorEl != null}
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "center",
        }}
        onClose={() => {
          setAnchorEl(null);
        }}
      >
        <List sx={{ maxHeight: "600px" }}>
          {allowedValues.map((value) => (
            <ListItem key={value} disablePadding>
              <ListItemButton
                dense
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  let newValues = selectedValues;
                  if (selectedValues.includes(value)) {
                    newValues = selectedValues.filter((x) => x !== value);
                  } else {
                    newValues = [...selectedValues, value];
                  }

                  setSelectedValues(newValues);
                  filterSet((f) => ({
                    ...f,
                    [filterKey]: newValues,
                  }));
                }}
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={selectedValues.includes(value)}
                    tabIndex={-1}
                    disableRipple
                  />
                </ListItemIcon>
                <ListItemText primary={value} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Popover>
    </>
  );
};

export default BookCatalog;
