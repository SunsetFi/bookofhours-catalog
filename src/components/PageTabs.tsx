import * as React from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { useAspect } from "@/services/sh-compendium";

const tabData = [
  {
    label: "Books",
    aspectIcon: "readable",
    path: "/books",
  },
  {
    label: "Provisions",
    aspectIcon: "beverage",
    path: "/provisions",
  },
  {
    label: "Tools",
    aspectIcon: "tool",
    path: "/tools",
  },
  {
    label: "Materials",
    aspectIcon: "material",
    path: "/materials",
  },
  {
    label: "Things",
    aspectIcon: "thing",
    path: "/things",
  },
  {
    label: "Furnishings",
    aspectIcon: "comfort",
    path: "/furnishings",
  },
  {
    label: "Skills",
    aspectIcon: "skill",
    path: "/skills",
  },
  {
    label: "Craftables",
    aspectIcon: "difficulty.keeper",
    path: "/craftables",
  },
  {
    label: "Workstations",
    aspectIcon: "forge",
    path: "/workstations",
  },
  {
    label: "Harvest",
    aspectIcon: "nectar",
    path: "/harvest",
  },
  {
    label: "Memories",
    aspectIcon: "memory",
    path: "/memories",
  },
];

const PageTabs = () => {
  return (
    <Box
      sx={{
        // This is stupid, but its what the titlebar does. and probably what tabs do too.
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04))",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 2,
        gap: 1,
      }}
    >
      {tabData.map(({ label, aspectIcon, path }) => (
        <PageTab key={path} label={label} aspectId={aspectIcon} path={path} />
      ))}
    </Box>
  );
};

interface PageTab {
  label: string;
  aspectId: string;
  path: string;
}
const PageTab = ({ label, aspectId, path }: PageTab) => {
  const aspect = useAspect(aspectId);
  const { pathname } = useLocation();
  const value = firstPathPart(pathname);
  return (
    <Tooltip
      title={<Typography variant="body1">{label}</Typography>}
      PopperProps={{ sx: { pointerEvents: "none" }, placement: "right" }}
    >
      <Link key={path} to={path}>
        <Box
          sx={{
            cursor: "pointer",
            filter:
              path !== value ? "brightness(75%) grayscale(0.9)" : undefined,
          }}
        >
          <img
            loading="lazy"
            style={{ display: "block" }}
            src={aspect.iconUrl}
            alt={label}
            width={40}
            height={40}
          />
        </Box>
      </Link>
    </Tooltip>
  );
};

function firstPathPart(pathname: string) {
  const [_, firstPart] = pathname.split("/", 2);
  return "/" + firstPart;
}

export default PageTabs;
