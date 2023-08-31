import * as React from "react";
import { sortBy } from "lodash";
import { Aspects } from "secrethistories-api";
import { map } from "rxjs";
import { pickBy } from "lodash";

import type { GridRenderCellParams } from "@mui/x-data-grid/models";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { useAspects } from "@/services/sh-compendium/hooks";
import { isNotNull } from "@/utils";

import { ElementDataGridColumnDef } from "../types";

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
  const allAspects = useAspects();
  const aspectPairs = sortBy(
    Object.entries(value)
      .map(([aspect, level]) => {
        const model = allAspects.find((a) => a.id === aspect);
        if (model == null) {
          return null;
        }

        return {
          id: aspect,
          label: model?.label ?? aspect,
          iconUrl: model?.iconUrl,
          level,
        };
      })
      .filter(isNotNull),
    "label"
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
      {aspectPairs.map(({ id, label, iconUrl, level }) => (
        <Box
          key={id}
          sx={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
          }}
        >
          <img src={iconUrl} alt={label} title={label} width={50} height={50} />
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
      ))}
    </Box>
  );
}
