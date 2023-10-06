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

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  elementStackColumnHelper,
} from "@/components/ObservableDataGrid2";

const SkillUpgradeButton = ({ model }: { model: ElementStackModel }) => {
  const orchestrator = useDIDependency(Orchestrator);
  const aspects = useDeferredObservation<Aspects>(model.aspects$) ?? {};
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
            desiredElementIds: [model.elementId],
          })
        }
      >
        <UpgradeIcon />
      </IconButton>
    </Box>
  );
};

const columns = [
  elementStackColumnHelper.display({
    id: "upgrade-button",
    header: "",
    size: 30,
    cell: (context) => <SkillUpgradeButton model={context.row.original} />,
  }),
  elementStackColumnHelper.elementIcon(),
  elementStackColumnHelper.label({
    header: "Skill",
    size: 200,
  }),
  elementStackColumnHelper.aspectsList("skill", ["skill"], {
    header: "Level",
    size: 180,
    enableColumnFilter: false,
  }),
  elementStackColumnHelper.aspectsList("aspects", powerAspects, {
    header: "Aspects",
    size: 200,
  }),
  // TODO: Pick wisdom tree aspects
  elementStackColumnHelper.description(),
];

const SkillsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const skills$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect(["skill"])),
    [tokensSource]
  );

  return (
    <PageContainer title="Esoteric Wisdoms" backTo="/">
      <RequireRunning />
      <ObservableDataGrid
        sx={{ height: "100%" }}
        columns={columns}
        defaultSortColumn="label"
        items$={skills$}
      />
    </PageContainer>
  );
};

export default SkillsCatalogPage;
