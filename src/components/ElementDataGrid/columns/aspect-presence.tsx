import * as React from "react";
import { Aspects } from "secrethistories-api";
import { map } from "rxjs";
import { pickBy } from "lodash";

import type { GridRenderCellParams } from "@mui/x-data-grid/models";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useAspect } from "@/services/sh-compendium/hooks";

import { ElementDataGridColumnDef } from "../types";
import { useObservation } from "@/observables";

type AspectFilter = readonly string[] | ((aspectId: string) => boolean);
function includeAspect(aspectId: string, filter: AspectFilter) {
  if (Array.isArray(filter)) {
    return filter.includes(aspectId);
  } else {
    return (filter as any)(aspectId);
  }
}

export interface AspectPresenseOpts {
  display?: "label" | "level" | "none";
}

export function aspectPresenceColumnDef(
  allowedAspects: AspectFilter,
  { display = "level" }: AspectPresenseOpts = {},
  additional: Partial<
    Omit<ElementDataGridColumnDef, "field" | "observable">
  > = {}
): ElementDataGridColumnDef {
  return {
    headerName: "Aspects",
    width: 120,
    wrap: true,
    renderCell: (props) => <AspectPresence {...props} display={display} />,
    ...additional,
    observable: (element) =>
      element.aspects$.pipe(
        map((aspects) =>
          pickBy(aspects, (_, key) => includeAspect(key, allowedAspects))
        )
      ),
  };
}

function AspectPresence({
  display,
  value = {},
}: GridRenderCellParams<any, Aspects> & {
  display: AspectPresenseOpts["display"];
}) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {Object.keys(value).map((aspectId) => (
        <AspectPresenseItem
          key={aspectId}
          aspectId={aspectId}
          level={value[aspectId] ?? 0}
          display={display}
        />
      ))}
    </Box>
  );
}

interface AspectPresenceItemProps {
  aspectId: string;
  level: number;
  display: AspectPresenseOpts["display"];
}

const AspectPresenseItem = ({
  aspectId,
  level,
  display,
}: AspectPresenceItemProps) => {
  const aspect = useAspect(aspectId);
  const label = useObservation(aspect.label$);

  if (!label) {
    return null;
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 2,
      }}
    >
      <img
        src={aspect.iconUrl}
        alt={label}
        title={label}
        width={50}
        height={50}
      />
      {display === "label" && (
        <Typography
          variant="body2"
          sx={{ whiteSpace: "break-spaces", width: "100%" }}
        >
          {label}
        </Typography>
      )}
      {display === "level" && <Typography variant="h4">{level}</Typography>}
    </Box>
  );
};
