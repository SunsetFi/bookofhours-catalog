import React from "react";
import { combineLatest, map } from "rxjs";
import { Aspects } from "secrethistories-api";
import { first, pick, values } from "lodash";

import { Stack, Typography, IconButton, Box } from "@mui/material";

import {
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
} from "@mui/icons-material";

import { CellContext } from "@tanstack/react-table";

import { useDIDependency } from "@/container";
import { filterItems, switchMapIfNotNull } from "@/observables";

import { venueAspectLabels, venueAspects } from "@/aspects";

import { useSetting } from "@/services/settings";
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
  multiSelectFilter,
  MultiselectFilter,
} from "@/components/ObservableDataGrid";
import {
  RowHeight,
  RowPaddingY,
} from "@/components/ObservableDataGrid/constants";
import AspectsList from "@/components/Aspects/AspectsList";
import DataGridPage from "@/components/DataGridPage";

const columnHelper = createObservableColumnHelper<ConnectedTerrainModel>();

const WorkstationCellWidth = 425;

const LocationsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const items$ = React.useMemo(
    () =>
      tokensSource.unsealedTerrains$.pipe(
        filterItems((x) => x.id !== "!brancrug"),
      ),
    [],
  );

  const columns = React.useMemo(
    () => [
      columnHelper.display({
        id: "focus-button",
        header: "",
        size: 50,
        meta: {
          columnName: "Focus",
        },
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
              column,
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
              value,
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
              >,
            ) => (
              <AspectsFilter
                {...props}
                allowedAspectIds="auto"
                columnValues={props.columnValues.map(
                  ([_, essentials, requirements]) => ({
                    ...essentials,
                    ...requirements,
                  }),
                )}
              />
            ),
          },
        },
      ),
      columnHelper.observe(
        (item) => item.children$.pipe(filterItems(isSituationModel)),
        {
          id: "workstations",
          header: "Workstations",
          size: WorkstationCellWidth,
          enableSorting: false,
          enableColumnFilter: false,
          cell: WorkstationsCell,
        },
      ),
      // TODO: Only show if DLC is enabled.
      columnHelper.observeText(
        (item) =>
          item.children$.pipe(
            filterItems(isSituationModel),
            filterItems((x) => x.payloadType === "SalonSituation"),
            map((x) => first(x) ?? null),
            switchMapIfNotNull((x) =>
              x.aspects$.pipe(
                map((aspects) => first(Object.keys(aspects)) ?? null),
              ),
            ),
          ),
        {
          id: "venue",
          header: "Venue Type",
          size: 175,
          enableSorting: false,
          enableColumnFilter: true,
          cell: (props) => {
            const aspect = props.getValue();
            if (!aspect) {
              return null;
            }
            return <Typography>{venueAspectLabels[aspect]}</Typography>;
          },
          filterFn: multiSelectFilter,
          meta: {
            filterComponent: (props: FilterComponentProps) => {
              return (
                <MultiselectFilter
                  allowedValues={venueAspectLabels}
                  {...props}
                />
              );
            },
          },
        },
      ),
      columnHelper.observeText("description$" as any, {
        id: "description",
        size: Number.MAX_SAFE_INTEGER,
        header: "Description",
      }),
    ],
    [],
  );

  return <DataGridPage title="Locations" columns={columns} items$={items$} />;
};

const WorkstationsCell = (
  props: CellContext<ConnectedTerrainModel, readonly SituationModel[]>,
) => {
  const workstations: readonly SituationModel[] = props.getValue();
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateRows: "repeat(2, minmax(0px, 1fr))",
        gridAutoFlow: "column",
        gap: 1,
        maxWidth: WorkstationCellWidth,
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
      <VerbIcon
        sx={{ flexShrink: 0, width: "40px", height: "40px" }}
        verbId={situation.verbId}
      />
      <Typography variant="body2">{label}</Typography>
    </Box>
  );
};

export default LocationsCatalogPage;
