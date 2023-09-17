import * as React from "react";
import { map } from "rxjs";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";

import VisibilityIcon from "@mui/icons-material/Visibility";

import { useDIDependency } from "@/container";

import { observeAll, useObservation } from "@/observables";

import { powerAspects } from "@/aspects";

import { GameModel, SituationModel } from "@/services/sh-game";

import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  ObservableDataGridColumnDef,
  aspectsObservableColumnDef,
  aspectsPresenceColumnDef,
  aspectsPresenceFilter,
  descriptionColumnDef,
  labelColumnDef,
  locationColumnDef,
  multiselectOptionsFilter,
} from "@/components/ObservableDataGrid";

const WorkstationCatalogPage = () => {
  const model = useDIDependency(GameModel);

  const elements$ = React.useMemo(() => model.unlockedWorkstations$, [model]);

  const locations =
    useObservation(
      () =>
        model.unlockedTerrains$.pipe(
          map((terrains) => terrains.map((terrain) => terrain.label$)),
          observeAll()
        ),
      [model]
    ) ?? [];

  const columns = React.useMemo(
    () => [
      {
        headerName: "",
        width: 50,
        field: "$item",
        renderCell: ({ value }) => (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <IconButton onClick={() => value.focus()}>
              <VisibilityIcon />
            </IconButton>
          </Box>
        ),
      } as ObservableDataGridColumnDef<SituationModel>,
      labelColumnDef<SituationModel>(),
      locationColumnDef<SituationModel>({
        filter: multiselectOptionsFilter("location", locations),
      }),
      aspectsPresenceColumnDef<SituationModel>(
        powerAspects,
        { display: "none", orientation: "horizontal" },
        {
          headerName: "Attunement",
          observable: "hints$",
          filter: aspectsPresenceFilter("attunement", powerAspects),
          width: 275,
        }
      ),
      aspectsPresenceColumnDef<SituationModel>(
        (aspect) => aspect.startsWith("e."),
        { display: "none" },
        // TODO: Dont use auto, find all possible evolutions
        {
          headerName: "Evolves",
          filter: aspectsPresenceFilter("evolves", "auto"),
        }
      ),
      aspectsObservableColumnDef<SituationModel>(
        "threshold",
        (situation) => situation.thresholdAspects$,
        (aspectId) => !powerAspects.includes(aspectId as any),
        {
          headerName: "Accepts",
        }
      ),
      descriptionColumnDef<SituationModel>(),
    ],
    [locations]
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
