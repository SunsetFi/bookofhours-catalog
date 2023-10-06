import * as React from "react";
import { Aspects } from "secrethistories-api";
import { map } from "rxjs";
import { pick } from "lodash";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import UpgradeIcon from "@mui/icons-material/Upgrade";

import { useDIDependency } from "@/container";
import { useDeferredObservation } from "@/observables";

import { aspectsMagnitude, powerAspects } from "@/aspects";

import {
  ElementStackModel,
  Orchestrator,
  TokensSource,
  filterHasAnyAspect,
} from "@/services/sh-game";

import PageContainer from "@/components/PageContainer";
import { RequireRunning } from "@/components/RequireLegacy";
import ObservableDataGrid, {
  createObservableColumnHelper,
} from "@/components/ObservableDataGrid2";
import ElementIcon from "@/components/ElementIcon";

import AspectsList from "@/components/AspectsList";

const columnHelper = createObservableColumnHelper<ElementStackModel>();

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
  columnHelper.display({
    id: "upgrade-button",
    header: "",
    size: 30,
    cell: (context) => <SkillUpgradeButton model={context.row.original} />,
  }),
  columnHelper.observe("elementId$", {
    id: "icon",
    header: "",
    size: 100,
    enableSorting: false,
    cell: (context) => (
      <ElementIcon width={75} elementId={context.getValue()} />
    ),
  }),
  columnHelper.observe("label$", {
    id: "label",
    header: "Skill",
    size: 200,
  }),
  columnHelper.observe(
    (model) => model.aspects$.pipe(map((aspects) => pick(aspects, ["skill"]))),
    {
      header: "Skill Level",
      size: 170,
      cell: (context) => <AspectsList aspects={context.getValue()} />,
    }
  ),
  columnHelper.observe(
    (model) =>
      // TODO: Also pick wisdom tree type.
      model.aspects$.pipe(map((aspects) => pick(aspects, powerAspects))),
    {
      id: "aspects",
      header: "Aspects",
      size: 200,
      sortingFn: (a, b, columnId) =>
        aspectsMagnitude(a.getValue(columnId)) -
        aspectsMagnitude(b.getValue(columnId)),
      cell: (context) => <AspectsList aspects={context.getValue()} />,
    }
  ),
  columnHelper.observe("description$", {
    size: Number.MAX_SAFE_INTEGER,
    header: "Description",
  }),
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
