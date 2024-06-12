import React from "react";
import { Aspects } from "secrethistories-api";
import { isEqual } from "lodash";
import { Observable, distinctUntilChanged, map, shareReplay } from "rxjs";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";
import { mapArrayItemsCached } from "@/observables";
import { evolutionAspects, powerAspects } from "@/aspects";
import { useQueryObjectState } from "@/hooks/use-queryobject";

import { decorateObjectInstance } from "@/object-decorator";

import { SituationModel, TokensSource } from "@/services/sh-game";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import FocusIconButton from "@/components/FocusIconButton";
import ObservableDataGrid, {
  createSituationColumnHelper,
} from "@/components/ObservableDataGrid";

type WorkstationModel = SituationModel & WorkstationModelDecorators;
interface WorkstationModelDecorators {
  thresholdAspects$: Observable<Aspects>;
}

const columnHelper = createSituationColumnHelper<WorkstationModel>();

function situationToWorkstationModel(
  situation: SituationModel
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
  });
}

const WorkstationCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () =>
      tokensSource.unlockedWorkstations$.pipe(
        mapArrayItemsCached(situationToWorkstationModel)
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
          model.hints$.pipe(
            map((h) =>
              h.reduce(
                (obj, h) => ({ ...obj, [h]: null }),
                {} as Record<string, React.ReactNode>
              )
            )
          ),
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

  return (
    <PageContainer title="Workstations" backTo="/">
      <RequireRunning />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <ObservableDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={elements$}
          filters={filters}
          onFiltersChanged={onFiltersChanged}
        />
      </Box>
    </PageContainer>
  );
};

export default WorkstationCatalogPage;
