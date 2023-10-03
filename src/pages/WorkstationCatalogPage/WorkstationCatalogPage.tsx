import * as React from "react";

import Box from "@mui/material/Box";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import { SituationModel, TokensSource } from "@/services/sh-game";

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
} from "@/components/ObservableDataGrid";
import FocusIconButton from "@/components/FocusIconButton";

const WorkstationCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const elements$ = React.useMemo(
    () => tokensSource.unlockedWorkstations$,
    [tokensSource]
  );

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
            <FocusIconButton token={value} />
          </Box>
        ),
      } as ObservableDataGridColumnDef<SituationModel>,
      labelColumnDef<SituationModel>(),
      locationColumnDef<SituationModel>(),
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
