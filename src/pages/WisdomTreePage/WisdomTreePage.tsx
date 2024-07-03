import React from "react";

import { Box, Stack, Typography } from "@mui/material";

import { useDIDependency } from "@/container";

import { TokensSource } from "@/services/sh-game";

import { useObservation } from "@/hooks/use-observation";

import PageContainer from "@/components/PageContainer";

import WisdomNodeSlot from "./components/WisdomNodeSlot";
import AspectIcon from "@/components/Aspects/AspectIcon";

interface WisdomDef {
  name: string;
  aspects: string[];
  nodePrefix: string;
}

const wisdoms: readonly WisdomDef[] = [
  {
    name: "Illumination",
    aspects: ["forge", "lantern", "edge"],
    nodePrefix: "!wt.ill.",
  },
  {
    name: "Hushery",
    aspects: ["lantern", "winter", "edge"],
    nodePrefix: "!wt.hus.",
  },
  {
    name: "Nyctodromy",
    aspects: ["moth", "knock", "lantern"],
    nodePrefix: "!wt.nyc.",
  },
  {
    name: "Skolekosophy",
    aspects: ["winter", "grail", "knock"],
    nodePrefix: "!wt.sko.",
  },
  {
    name: "The Bosk",
    aspects: ["grail", "heart", "moth"],
    nodePrefix: "!wt.bos.",
  },
  {
    name: "Preservation",
    aspects: ["heart", "grail"],
    nodePrefix: "!wt.pre.",
  },
  {
    name: "Birdsong",
    aspects: ["heart", "moth"],
    nodePrefix: "!wt.bir.",
  },
  {
    name: "Horomachistry",
    aspects: ["lantern", "forge", "edge"],
    nodePrefix: "!wt.hor.",
  },
  {
    name: "Ithastry",
    aspects: ["forge", "winter", "knock"],
    nodePrefix: "!wt.ith.",
  },
];

const WisdomTreePage = () => {
  const tokensSource = useDIDependency(TokensSource);
  const nodes = useObservation(tokensSource.wisdomTreeNodes$) ?? [];

  const locus = nodes.find((x) => x.id === "!wt.memorylocus");

  return (
    <PageContainer title="Wisdoms">
      <Stack
        sx={{ width: "100%", height: "100%", pl: 2 }}
        direction="row"
        spacing={2}
        alignItems="center"
      >
        {locus && <WisdomNodeSlot node={locus} />}
        <Box
          sx={{
            width: "100%",
            height: "100%",
            display: "grid",
            gridTemplateRows: `repeat(${wisdoms.length}, 1fr)`,
            gridTemplateColumns: "repeat(10, fit-content(100%))",
            gap: 2,
            overflowY: "scroll",
            py: 2,
          }}
        >
          {wisdoms.map((wisdom, i) => {
            return (
              <React.Fragment key={wisdom.name}>
                <Stack
                  direction="column"
                  sx={{ gridRow: i + 1, gridColumn: 1, pr: 3 }}
                  spacing={2}
                  justifyContent="center"
                  alignItems="center"
                >
                  <Typography variant="h4">{wisdom.name}</Typography>
                  <Stack direction="row" spacing={1}>
                    {wisdom.aspects.map((aspect) => (
                      <AspectIcon key={aspect} aspectId={aspect} />
                    ))}
                  </Stack>
                </Stack>
                {nodes
                  .filter((x) => x.id.startsWith(wisdom.nodePrefix))
                  .map((node, ni) => (
                    <WisdomNodeSlot
                      sx={{ gridRow: i + 1, gridColumn: ni + 2 }}
                      key={node.id}
                      node={node}
                    />
                  ))}
              </React.Fragment>
            );
          })}
        </Box>
      </Stack>
    </PageContainer>
  );
};

export default WisdomTreePage;
