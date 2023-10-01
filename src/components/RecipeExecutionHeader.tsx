import * as React from "react";
import { map } from "rxjs";

import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Popover, { PopoverActions } from "@mui/material/Popover";
import PlayCircle from "@mui/icons-material/PlayCircle";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import type { SxProps } from "@mui/material/styles";

import { useDIDependency } from "@/container";
import { filterItemObservations, useObservation } from "@/observables";
import { useMutationObserver } from "@/hooks/use-mutation-observer";

import { SituationModel, TokensSource } from "@/services/sh-game";

import FocusIconButton from "./FocusIconButton";

export interface RecipeExecutionHeaderProps {
  sx?: SxProps;
}
const RecipeExecutionHeader = ({ sx }: RecipeExecutionHeaderProps) => {
  const actionsRef = React.useRef<PopoverActions>(null);
  const [executingSituationsRef, setExecutingSituationsRef] =
    React.useState<HTMLElement | null>(null);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  useMutationObserver(executingSituationsRef, () => {
    if (actionsRef.current == null) {
      return;
    }

    actionsRef.current.updatePosition();
  });

  const tokensSource = useDIDependency(TokensSource);
  const executingSituations =
    useObservation(
      () =>
        tokensSource.visibleSituations$.pipe(
          filterItemObservations((s) =>
            s.state$.pipe(map((s) => s !== "Unstarted"))
          )
        ),
      [tokensSource]
    ) ?? [];

  return (
    <>
      <Badge badgeContent={executingSituations.length} color="primary" sx={sx}>
        <IconButton
          title="Recipe Executions"
          onClick={(e) => setAnchorEl(e.currentTarget)}
        >
          <PlayCircle />
        </IconButton>
      </Badge>
      <Popover
        action={actionsRef}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: "right",
          vertical: "bottom",
        }}
      >
        <List
          ref={setExecutingSituationsRef}
          sx={{
            width: "400px",
          }}
        >
          {executingSituations.map((situation) => (
            <ExecutingSituationListItem
              key={situation.id}
              situation={situation}
            />
          ))}
        </List>
      </Popover>
    </>
  );
};

export default RecipeExecutionHeader;

interface ExecutingSituationListItemProps {
  situation: SituationModel;
}
const ExecutingSituationListItem = ({
  situation,
}: ExecutingSituationListItemProps) => {
  const label = useObservation(situation.verbLabel$);
  const recipeLabel = useObservation(situation.recipeLabel$);

  return (
    <ListItem secondaryAction={<FocusIconButton token={situation} />}>
      <ListItemText sx={{ pr: 1 }} primary={label} secondary={recipeLabel} />
    </ListItem>
  );
};
