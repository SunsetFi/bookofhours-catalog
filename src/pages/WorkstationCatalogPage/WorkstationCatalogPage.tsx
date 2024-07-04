import React from "react";
import { Aspects } from "secrethistories-api";
import { isEqual } from "lodash";
import { Observable, distinctUntilChanged, map, shareReplay } from "rxjs";

import { Box, IconButton, IconButtonProps } from "@mui/material";
import { PlayCircle } from "@mui/icons-material";

import { useDIDependency } from "@/container";
import { mapArrayItemsCached } from "@/observables";
import { evolutionAspects, powerAspects } from "@/aspects";
import { brancrugTokens } from "@/spheres";
import { decorateObjectInstance } from "@/object-decorator";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import {
  Orchestrator,
  SituationModel,
  TokensSource,
  filterTokenNotInPath,
} from "@/services/sh-game";

import PageContainer from "@/components/PageContainer";
import FocusIconButton from "@/components/FocusIconButton";
import {
  IdentifierItemDataGrid,
  aspectsPresentFilter,
  createSituationColumnHelper,
  useQuerySort,
} from "@/components/ObservableDataGrid";

type WorkstationModel = SituationModel & WorkstationModelDecorators;
interface WorkstationModelDecorators {
  thresholdAspects$: Observable<Aspects>;
  orchestrate(): void;
}

const columnHelper = createSituationColumnHelper<WorkstationModel>();

function situationToWorkstationModel(
  situation: SituationModel,
  orchestrator: Orchestrator
): WorkstationModel {
  return decorateObjectInstance(situation, {
    thresholdAspects$: situation.thresholds$.pipe(
      map((thresholds) => {
        const slotTypes: Aspects = {};
        for (const t of thresholds) {
          for (const type in t.required) {
            if (slotTypes[type] === undefined) {
              slotTypes[type] = 0;
            }
            slotTypes[type] += t.required[type];
          }
        }

        return slotTypes;
      }),
      distinctUntilChanged(isEqual),
      shareReplay(1)
    ),
    orchestrate: () => {
      orchestrator.openOrchestration({ situation });
    },
  } satisfies WorkstationModelDecorators);
}

const OrchestrateIconButton = (props: IconButtonProps) => (
  <IconButton title="Open Workstation" {...props}>
    <PlayCircle />
  </IconButton>
);

const WorkstationCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const orchestrator = useDIDependency(Orchestrator);

  const elements$ = React.useMemo(
    () =>
      tokensSource.unlockedWorkstations$.pipe(
        filterTokenNotInPath(brancrugTokens),
        mapArrayItemsCached((situation) =>
          situationToWorkstationModel(situation, orchestrator)
        )
      ),
    [tokensSource]
  );

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
            {/* TODO: Not functional yet. */}
            <OrchestrateIconButton onClick={() => row.original.orchestrate()} />
          </Box>
        ),
      }),
      columnHelper.verbIcon(),
      columnHelper.label(),
      columnHelper.location(),
      columnHelper.aspectsList("attunement", powerAspects, {
        header: "Attunement",
        size: 200,
        aspectsSource: (model) =>
          // Hints come in as a string of allowed aspects, but aspectsList is a list of aspects with their values.
          // We could just supply null as the value, but that would make the aspect undefined and cause our filter
          // to not include it.
          model.hints$.pipe(
            map((h) =>
              h.reduce(
                // Pass null as the aspect value to prevent rendering any value.
                (obj, h) => ({ ...obj, [h]: null }),
                {} as Record<string, React.ReactNode>
              )
            )
          ),
        // Because we only care about presence (and are using null values), we need to use the aspectsPresentFilter
        filterFn: aspectsPresentFilter,
      }),
      columnHelper.aspectsList("evolves", evolutionAspects, {
        header: "Evolves",
        size: 125,
        enableSorting: false,
        showLevel: false,
      }),
      columnHelper.aspectsList(
        "accepts",
        (aspectId) => !powerAspects.includes(aspectId as any),
        {
          header: "Accepts",
          size: 400,
          aspectsSource: (model) => model.thresholdAspects$,
        }
      ),
      columnHelper.description(),
    ],
    []
  );

  const [filters, onFiltersChanged] = useQueryObjectState();
  const [sortState, onSortingChanged] = useQuerySort();

  return (
    <PageContainer title="Workstations">
      <IdentifierItemDataGrid
        sx={{ height: "100%" }}
        columns={columns}
        items$={elements$}
        filters={filters}
        sorting={sortState}
        onSortingChanged={onSortingChanged}
        onFiltersChanged={onFiltersChanged}
      />
    </PageContainer>
  );
};

export default WorkstationCatalogPage;
