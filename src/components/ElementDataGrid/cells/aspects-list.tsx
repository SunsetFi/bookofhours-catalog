import * as React from "react";
import { sortBy } from "lodash";
import { Aspects } from "secrethistories-api";

import type { GridRenderCellParams } from "@mui/x-data-grid/models";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

import { isNotNull } from "@/utils";

import { useAspects } from "@/services/sh-compendium/hooks";

export function renderAspects({
  value = {},
}: GridRenderCellParams<any, Aspects>) {
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
    <Box
      sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 2 }}
    >
      {aspectPairs.map(({ label, iconUrl, level }) => (
        <Box
          key={label}
          sx={{ display: "flex", flexDirection: "row", alignItems: "center" }}
        >
          <img src={iconUrl} alt={label} title={label} width={40} height={40} />
          <Typography variant="body2" sx={{ pl: 1 }}>
            {level}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
