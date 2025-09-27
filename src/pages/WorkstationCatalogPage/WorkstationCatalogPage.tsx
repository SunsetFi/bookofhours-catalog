import React from "react";
import { Aspects } from "secrethistories-api";
import { isEqual } from "lodash";
import { Observable, distinctUntilChanged, map, shareReplay } from "rxjs";

import { Box } from "@mui/material";

import { useDIDependency } from "@/container";
import { mapArrayItemsCached } from "@/observables";
import { evolutionAspects, powerAspects } from "@/aspects";
import { brancrugTokens } from "@/spheres";
import { decorateObjectInstance } from "@/object-decorator";

import {
  Orchestrator,
  SituationModel,
  TokensSource,
  filterTokenNotInPath,
} from "@/services/sh-game";

import FocusIconButton from "@/components/FocusIconButton";
import {
  aspectsPresentFilter,
  createSituationColumnHelper,
} from "@/components/ObservableDataGrid";
import DataGridPage from "@/components/DataGridPage";
import OrchestrationIconButton from "@/components/OrchestrationIconButton";

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

const WorkstationCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const orchestrator = useDIDependency(Orchestrator);

  const elements$ = React.useMemo(
    () =>
      tokensSource.unlockedWorkstations$.pipe(
        filterTokenNotInPath(brancrugTokens),
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
            <OrchestrationIconButton
              interactivity="minimal"
              onClick={() => row.original.orchestrate()}
            />
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
                {} as Record<string, React.ReactNode>,
              ),
            ),
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
        },
      ),
      columnHelper.description(),
    ],
    [],
  );

  return (
    <DataGridPage title="Workstations" columns={columns} items$={elements$} />
  );
};

export default WorkstationCatalogPage;
