import * as React from "react";
import { Aspects } from "secrethistories-api";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import UpgradeIcon from "@mui/icons-material/Upgrade";

import { useDIDependency } from "@/container";
import { useDeferredObservation } from "@/observables";

import { powerAspects } from "@/aspects";

import {
  ElementStackModel,
  Orchestrator,
  TokensSource,
  filterHasAnyAspect,
} from "@/services/sh-game";

import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  descriptionColumnDef,
  iconColumnDef,
  labelColumnDef,
  aspectsColumnDef,
  ObservableDataGridColumnDef,
  aspectsObservableColumnDef,
} from "@/components/ObservableDataGrid";
import PageContainer from "@/components/PageContainer";

const SkillsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const orchestrator = useDIDependency(Orchestrator);

  const skills$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect(["skill"])),
    [tokensSource]
  );

  const columns = React.useMemo(
    () => [
      {
        headerName: "",
        width: 50,
        field: "$item",
        renderCell: ({ value }) => {
          const aspects = useDeferredObservation<Aspects>(value.aspects$) ?? {};
          const skillLevel = aspects["skill"] ?? 0;
          if (skillLevel <= 0 || skillLevel >= 9) {
            return null;
          }

          const recipeId = `u.skill.to${skillLevel + 1}`;
          return (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <IconButton
                onClick={() =>
                  orchestrator.requestOrchestration({
                    recipeId,
                    desiredElementIds: [value.elementId],
                  })
                }
              >
                <UpgradeIcon />
              </IconButton>
            </Box>
          );
        },
      } as ObservableDataGridColumnDef<ElementStackModel>,
      iconColumnDef<ElementStackModel>(),
      labelColumnDef<ElementStackModel>(),
      aspectsObservableColumnDef<ElementStackModel>(
        "skillLevel",
        (element) => element.aspects$,
        ["skill"],
        {
          headerName: "Skill Level",
          width: 170,
        }
      ),
      aspectsColumnDef<ElementStackModel>(powerAspects, { width: 200 }),
      descriptionColumnDef<ElementStackModel>(),
    ],
    [orchestrator]
  );

  return (
    <PageContainer title="Esoteric Wisdoms" backTo="/">
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
        }}
      >
        <RequireRunning />
        <ObservableDataGrid
          sx={{ height: "100%" }}
          columns={columns}
          items$={skills$}
        />
      </Box>
    </PageContainer>
  );
};

export default SkillsCatalogPage;
