import * as React from "react";
import { useObservableState } from "observable-hooks";
import {
  Observable,
  combineLatest,
  of as observableOf,
  map,
  mergeMap,
} from "rxjs";

import { Box, TableRow, TableCell, Typography } from "@mui/material";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { observeAll } from "@/observables";
import { useDIDependency } from "@/container";

import { ElementStackModel, GameModel } from "@/services/sh-monitor";
import { API } from "@/services/sh-api";

import { RequireLegacy } from "@/components/RequireLegacy";

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

const columns: GridColDef<TableBookItem>[] = [
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
  },
  {
    field: "location",
    headerName: "Location",
    width: 150,
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
    renderCell: ({ value }) => (
      <Box
        sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
      >
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
    ),
  },
];

function elementStackToItem(
  api: API,
  elementStack: ElementStackModel
): Observable<TableBookItem> {
  return combineLatest([
    elementStack.label$,
    elementStack.description$,
    elementStack.parentTerrain$.pipe(
      mergeMap((terrain) => terrain?.label$ ?? observableOf(null))
    ),
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

function autoRowHeight() {
  return "auto" as const;
}

const BookCatalog = () => {
  const api = useDIDependency(API);
  const model = useDIDependency(GameModel);
  const readables$ = model.visibleReadables$.pipe(
    map((readables) => readables.map((item) => elementStackToItem(api, item))),
    observeAll()
  );
  const readables = useObservableState(readables$, []);

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
        <DataGrid
          columns={columns}
          rows={readables}
          rowHeight={100}
          // getRowHeight={autoRowHeight}
          density="comfortable"
          pageSizeOptions={[10, 25, 50]}
        />
      </Box>
    </Box>
  );
};

interface BookRowProps {
  book: ElementStackModel;
}

const BookRow = ({ book }: BookRowProps) => {
  const label = useObservableState(book.label$, null);
  const description = useObservableState(book.description$, null);
  const parentTerrain = useObservableState(book.parentTerrain$, null);
  const terrainLabel = useObservableState(
    parentTerrain?.label$ ?? observableOf(null),
    null
  );

  return (
    <TableRow>
      <TableCell>
        <img src={book.iconUrl} style={{ width: "50px" }} />
      </TableCell>
      <TableCell>{label}</TableCell>
      <TableCell>{terrainLabel ?? "Unknown"}</TableCell>
      <TableCell>
        <Mystery elementStack={book} />
      </TableCell>
      <TableCell>{description}</TableCell>
    </TableRow>
  );
};

interface MysteryProps {
  elementStack: ElementStackModel;
}

const Mystery = ({ elementStack }: MysteryProps) => {
  const api = useDIDependency(API);
  const aspects = useObservableState(elementStack.elementAspects$, {});

  const masteryKey = Object.keys(aspects).find((x) => x.startsWith("mystery."));

  if (masteryKey == null) {
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
      <img
        style={{ width: "50px" }}
        src={`${api.baseUrl}/api/compendium/elements/${masteryKey}/icon.png`}
      />
      <Typography
        style={{ whiteSpace: "nowrap" }}
        component="span"
        variant="h4"
        color="text.secondary"
      >
        {aspects[masteryKey]}
      </Typography>
    </Box>
  );
};

export default BookCatalog;
