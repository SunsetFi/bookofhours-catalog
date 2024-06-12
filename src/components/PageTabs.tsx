import React from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";

import Box from "@mui/material/Box";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import MuiLink from "@mui/material/Link";
import GithubIcon from "@mui/icons-material/GitHub";

import sitemap, { SiteMapItem, getSitemapItemIconPath } from "@/sitemap";

import { useObservation } from "@/hooks/use-observation";

import { useAspect } from "@/services/sh-compendium";

const PageTabs = () => {
  return (
    <Box
      component="nav"
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
      {sitemap.map((item) => (
        <PageTab key={item.path} item={item} />
      ))}
      <Box sx={{ mt: "auto" }}>
        <Tooltip
          title="View Project on Github"
          PopperProps={{ sx: { pointerEvents: "none" }, placement: "right" }}
        >
          <MuiLink
            href="https://github.com/SunsetFi/bookofhours-catalog"
            target="_blank"
          >
            <GithubIcon fontSize="large" sx={{ mr: 1 }} />
          </MuiLink>
        </Tooltip>
      </Box>
    </Box>
  );
};

interface PageTab {
  item: SiteMapItem;
}
const PageTab = ({ item }: PageTab) => {
  const { label, path } = item;
  const iconUrl = `http://localhost:8081/${getSitemapItemIconPath(item)}`;
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
            src={iconUrl}
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
