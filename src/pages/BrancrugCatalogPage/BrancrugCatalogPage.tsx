import React from "react";
import { Aspects } from "secrethistories-api";
import { isEqual } from "lodash";
import { Observable, distinctUntilChanged, map, shareReplay } from "rxjs";

import { Box, IconButtonProps } from "@mui/material";

import { useDIDependency } from "@/container";
import { mapArrayItemsCached } from "@/observables";
import { powerAspects } from "@/aspects";
import { brancrugTokens } from "@/spheres";
import { decorateObjectInstance } from "@/object-decorator";

import {
  Orchestrator,
  SituationModel,
  TokensSource,
  filterTokenInPath,
} from "@/services/sh-game";

import FocusIconButton from "@/components/FocusIconButton";
import { createSituationColumnHelper } from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";
import CraftIconButton from "@/components/OrchestrationIconButton";

type WorkstationModel = SituationModel & WorkstationModelDecorators;
interface WorkstationModelDecorators {
  thresholdAspects$: Observable<Aspects>;
  orchestrate(): void;
}

const columnHelper = createSituationColumnHelper<WorkstationModel>();

function situationToWorkstationModel(
  situation: SituationModel,
  orchestrator: Orchestrator,
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
      shareReplay(1),
    ),
    orchestrate: () => {
      orchestrator.openOrchestration({ situation });
    },
  } satisfies WorkstationModelDecorators);
}

const OrchestrateIconButton = (props: IconButtonProps) => (
  <CraftIconButton
    interactivity="minimal"
    title="Open Workstation"
    {...props}
  />
);

const BrancrugCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const orchestrator = useDIDependency(Orchestrator);

  const elements$ = React.useMemo(
    () =>
      tokensSource.unlockedWorkstations$.pipe(
        filterTokenInPath(brancrugTokens),
        mapArrayItemsCached((situation) =>
          situationToWorkstationModel(situation, orchestrator),
        ),
      ),
    [tokensSource],
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
            {/* TODO: Not functional yet. */}
            <OrchestrateIconButton onClick={() => row.original.orchestrate()} />
          </Box>
        ),
      }),
      columnHelper.verbIcon(),
      columnHelper.label(),
      columnHelper.aspectsList("attunement", powerAspects, {
        header: "Attunement",
        size: 200,
        aspectsSource: (model) =>
          model.hints$.pipe(
            map((h) =>
              h.reduce(
                (obj, h) => ({ ...obj, [h]: null }),
                {} as Record<string, React.ReactNode>,
              ),
            ),
          ),
      }),
      columnHelper.aspectsList(
        "accepts",
        (aspectId) => !powerAspects.includes(aspectId as any),
        {
          header: "Accepts",
          size: 400,
          aspectsSource: (model) => model.thresholdAspects$,
        },
      ),
      columnHelper.description(),
    ],
    [],
  );

  return (
    <DataGridPage
      title="Brancrug and Environs"
      columns={columns}
      items$={elements$}
    />
  );
};

export default BrancrugCatalogPage;
