import React from "react";
import { useLocation } from "react-router";
import { Link } from "react-router-dom";
import {
  Divider,
  Box,
  Tooltip,
  Typography,
  Link as MuiLink,
  SvgIcon,
  IconButton,
} from "@mui/material";
import { GitHub as GithubIcon } from "@mui/icons-material";

import SixthHistoryIcon from "@/assets/icons/sixthhistory.svg?react";

import sitemap, {
  SiteMapNavItem,
  getSitemapItemIconPath,
  isSiteMapDividerItem,
  isSiteMapNavItem,
} from "@/sitemap";
import LicenseDialog from "./LicenseDialog";

const PageTabs = () => {
  const [licenseOpen, setLicenseOpen] = React.useState(false);

  return (
    <Box
      component="nav"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 1,
        // This is stupid, but its what the titlebar does. and probably what tabs do too.
        backgroundImage:
          "linear-gradient(rgba(255, 255, 255, 0.04), rgba(255, 255, 255, 0.04))",
        height: "100%",
        p: 2,
      }}
    >
      {sitemap.map((item, i) => {
        if (isSiteMapDividerItem(item)) {
          return (
            <Box key={i} sx={{ p: 0.5, width: "100%" }}>
              <Divider orientation="horizontal" />
            </Box>
          );
        } else if (isSiteMapNavItem(item)) {
          return <PageTab key={i} item={item} />;
        } else {
          return null;
        }
      })}
      <Box sx={{ mt: "auto" }} />
      <LicenseDialog open={licenseOpen} onClose={() => setLicenseOpen(false)} />
      <Tooltip title="Released under the Sixth History License">
        <IconButton
          disableRipple
          color="primary"
          onClick={() => setLicenseOpen(true)}
        >
          <SvgIcon
            component={SixthHistoryIcon as React.ElementType}
            sx={{
              display: "block",
            }}
            alt="Sixth History License"
            color="inherit"
            fontSize="large"
            viewBox="0 0 156 156"
          />
        </IconButton>
      </Tooltip>
      <Tooltip
        title="View Project on Github"
        PopperProps={{ sx: { pointerEvents: "none" }, placement: "right" }}
      >
        <MuiLink
          href="https://github.com/SunsetFi/bookofhours-catalog"
          target="_blank"
          sx={{
            display: "block",
          }}
        >
          <GithubIcon fontSize="large" />
        </MuiLink>
      </Tooltip>
    </Box>
  );
};

interface PageTab {
  item: SiteMapNavItem;
}
const PageTab = ({ item }: PageTab) => {
  const { label, path } = item;
  const iconUrl = `http://localhost:8081/${getSitemapItemIconPath(item)}`;
  const { pathname } = useLocation();
  const value = firstPathPart(pathname);
  const isActive = value === path;
  return (
    <Tooltip
      title={<Typography variant="body1">{label}</Typography>}
      PopperProps={{ sx: { pointerEvents: "none" }, placement: "right" }}
    >
      <Link key={path} to={path}>
        <Box
          sx={{
            cursor: "pointer",
            filter: !isActive ? "brightness(75%) grayscale(0.9)" : undefined,
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
