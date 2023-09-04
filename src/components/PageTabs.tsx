import * as React from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

import Box from "@mui/material/Box";

import AspectIcon from "./AspectIcon";

const tabData = [
  {
    label: "Books",
    aspectIcon: "readable",
    path: "/book-catalog",
  },
  {
    label: "Provisions",
    aspectIcon: "beverage",
    path: "/provisions-catalog",
  },
  {
    label: "Tools",
    aspectIcon: "tool",
    path: "/tools-catalog",
  },
  {
    label: "Materials",
    aspectIcon: "material",
    path: "/materials-catalog",
  },
  {
    label: "Furnishings",
    aspectIcon: "comfort",
    path: "/furnishings-catalog",
  },
  {
    label: "Workstations",
    aspectIcon: "forge",
    path: "/workstations-catalog",
  },
  {
    label: "Memories",
    aspectIcon: "memory",
    path: "/memories",
  },
];

const PageTabs = () => {
  const { pathname } = useLocation();
  const value = firstPathPart(pathname);
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
        <Link to={path}>
          <AspectIcon
            sx={{
              filter:
                path !== value ? "brightness(75%) grayscale(0.9)" : undefined,
            }}
            title={label}
            aspectId={aspectIcon}
            size={40}
          />
        </Link>
      ))}
    </Box>
  );
};

function firstPathPart(pathname: string) {
  const [_, firstPart] = pathname.split("/", 2);
  return "/" + firstPart;
}

export default PageTabs;
