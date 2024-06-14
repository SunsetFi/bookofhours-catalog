import React from "react";
import { Aspects } from "secrethistories-api";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import UpgradeIcon from "@mui/icons-material/Upgrade";

import { useDIDependency } from "@/container";

import { powerAspects } from "@/aspects";

import {
  ElementStackModel,
  Orchestrator,
  TokensSource,
  filterHasAnyAspect,
} from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";
import { useQueryObjectState } from "@/hooks/use-queryobject";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  createElementStackColumnHelper,
} from "@/components/ObservableDataGrid";

const columnHelper = createElementStackColumnHelper();

const SkillUpgradeButton = ({ model }: { model: ElementStackModel }) => {
  const orchestrator = useDIDependency(Orchestrator);
  const aspects = useObservation<Aspects>(model.aspects$) ?? {};
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
          orchestrator.openOrchestration({
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
  columnHelper.display({
    id: "upgrade-button",
    header: "",
    size: 30,
    cell: (context) => <SkillUpgradeButton model={context.row.original} />,
  }),
  columnHelper.elementStackIcon(),
  columnHelper.label({
    header: "Skill",
    size: 200,
  }),
  columnHelper.aspectsList("skill", ["skill"], {
    header: "Level",
    size: 180,
    enableColumnFilter: false,
  }),
  columnHelper.aspectsList("aspects", powerAspects, {
    header: "Aspects",
    size: 200,
  }),
  // TODO: Pick wisdom tree aspects
  columnHelper.description(),
];

const SkillsCatalogPage = () => {
  const tokensSource = useDIDependency(TokensSource);

  const skills$ = React.useMemo(
    () =>
      tokensSource.visibleElementStacks$.pipe(filterHasAnyAspect(["skill"])),
    [tokensSource]
  );

  const [filter, onFiltersChanged] = useQueryObjectState();

  return (
    <PageContainer title="Esoteric Wisdoms" backTo="/">
      <RequireRunning />
      <ObservableDataGrid
        sx={{ height: "100%" }}
        columns={columns}
        defaultSortColumn="label"
        filters={filter}
        onFiltersChanged={onFiltersChanged}
        items$={skills$}
      />
    </PageContainer>
  );
};

export default SkillsCatalogPage;
