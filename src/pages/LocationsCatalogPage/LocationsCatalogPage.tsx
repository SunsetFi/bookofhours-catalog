import React from "react";
import { combineLatest } from "rxjs";
import { Aspects } from "secrethistories-api";

import { Stack, Typography, IconButton, Box } from "@mui/material";

import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";

import { CellContext } from "@tanstack/react-table";

import { useDIDependency } from "@/container";
import { filterItems } from "@/observables";

import {
  ConnectedTerrainModel,
  SituationModel,
  TokensSource,
  TerrainUnlocker,
  isSituationModel,
  Orchestrator,
} from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import FocusIconButton from "@/components/FocusIconButton";
import VerbIcon from "@/components/VerbIcon";
import {
  createObservableColumnHelper,
  aspectsFilter,
  AspectsFilter,
  FilterComponentProps,
  AspectsFilterValue,
} from "@/components/ObservableDataGrid";
import {
  RowHeight,
  RowPaddingY,
} from "@/components/ObservableDataGrid/constants";
import AspectsList from "@/components/Aspects/AspectsList";
import DataGridPage from "@/components/DataGridPage";
import { useSetting } from "@/services/settings";

const columnHelper = createObservableColumnHelper<ConnectedTerrainModel>();

const LocationsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const items$ = tokensSource.unsealedTerrains$;

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "focus-button",
        header: "",
        size: 50,
        cell: ({ row }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <FocusIconButton token={row.original} />
          </Box>
        ),
      }),
      columnHelper.observeText("label$", {
        id: "label",
        header: "Location",
        rowHeader: true,
        size: 200,
      }),
      columnHelper.observe<[boolean, Aspects, Aspects]>(
        (item) =>
          combineLatest([
            item.shrouded$,
            item.unlockEssentials$,
            item.unlockRequirements$,
          ]),
        {
          id: "locked",
          header: "Unlocked",
          size: 300,
          filterFn: (row, column, value) => {
            // HACK: This makes multi group rows hard.
            // We should make filters take values, not rows and columns
            // Or look into column groups?
            const [shrouded, essentials, requirements] = row.getValue(
              column
            ) as any;

            let aspects: Aspects = {};
            if (shrouded) {
              aspects = { ...essentials, ...requirements };
            }

            return aspectsFilter(
              {
                getValue: () => aspects,
              } as any,
              column,
              value
            );
          },
          cell: (props) => {
            const interactivity = useSetting("interactivity");
            const unlocker = useDIDependency(TerrainUnlocker);
            const [shrouded, unlockEssentials, unlockRequirements] =
              props.getValue();

            if (shrouded) {
              return (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={2}
                  sx={{ width: "100%" }}
                >
                  {interactivity === "read-only" && <LockIcon />}
                  {interactivity !== "read-only" && (
                    <IconButton
                      onClick={() => unlocker.open(props.row.original)}
                      aria-label="Unlock"
                    >
                      <LockIcon />
                    </IconButton>
                  )}
                  <Stack direction="column" spacing={1} sx={{ width: "100%" }}>
                    <AspectsList aspects={unlockEssentials} />
                    <AspectsList aspects={unlockRequirements} />
                  </Stack>
                </Stack>
              );
            }

            return <LockOpenIcon sx={{ ml: 1 }} />;
          },
          meta: {
            filterComponent: (
              props: FilterComponentProps<
                AspectsFilterValue,
                [boolean, Aspects, Aspects]
              >
            ) => (
              <AspectsFilter
                {...props}
                allowedAspectIds="auto"
                columnValues={props.columnValues.map(
                  ([_, essentials, requirements]) => ({
                    ...essentials,
                    ...requirements,
                  })
                )}
              />
            ),
          },
        }
      ),
      columnHelper.observe(
        (item) => item.children$.pipe(filterItems(isSituationModel)),
        {
          id: "workstations",
          header: "Workstations",
          size: 700,
          enableSorting: false,
          enableColumnFilter: false,
          cell: WorkstationsCell,
        }
      ),
      columnHelper.observeText("description$" as any, {
        id: "description",
        size: Number.MAX_SAFE_INTEGER,
        header: "Description",
      }),
    ],
    []
  );

  return <DataGridPage title="Locations" columns={columns} items$={items$} />;
};

const WorkstationsCell = (
  props: CellContext<ConnectedTerrainModel, readonly SituationModel[]>
) => {
  const workstations: readonly SituationModel[] = props.getValue();
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: 1,
        height: RowHeight - RowPaddingY * 2,
      }}
    >
      {workstations.map((workstation) => (
        <SituationLineItem key={workstation.id} situation={workstation} />
      ))}
    </Box>
  );
};

interface SituationLineItemProps {
  situation: SituationModel;
}
const SituationLineItem = ({ situation }: SituationLineItemProps) => {
  const orchestrator = useDIDependency(Orchestrator);
  const verbId = useObservation(situation.verbId$);
  const label = useObservation(situation.verbLabel$);
  if (!verbId || !label) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        cursor: "pointer",
        gap: 1,
      }}
      onClick={() => orchestrator.openOrchestration({ situation })}
    >
      <VerbIcon verbId={situation.verbId} />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
};

export default LocationsCatalogPage;
