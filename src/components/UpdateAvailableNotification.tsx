import React from "react";
import ReactDOM from "react-dom";

import { Button, IconButton, Stack, Typography, useTheme } from "@mui/material";
import { Close, GitHub, Download } from "@mui/icons-material";

import { useDIDependency } from "@/container";

import { GithubUpdateService } from "@/services/github-updates";

import { useObservation } from "@/hooks/use-observation";
import { findBepInExPluginAsset } from "@/github";

const UpdateAvailableNotification = () => {
  const theme = useTheme();

  const updateService = useDIDependency(GithubUpdateService);
  const notifyNewRelease = useObservation(updateService.notifyNewRelease$);
  const newRelease = useObservation(updateService.newVersion$);

  if (!notifyNewRelease || !newRelease) {
    return null;
  }

  const downloadAsset = findBepInExPluginAsset(newRelease);

  const content = (
    <Stack
      direction="column"
      alignItems="center"
      sx={{
        position: "absolute",
        right: 0,
        top: "140px",
        backgroundColor: theme.palette.background.default,
        borderColor: theme.palette.divider,
        borderWidth: 1,
        borderStyle: "solid",
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
        p: 1,
        px: 1,
      }}
    >
      <Stack direction="row" alignItems="center">
        <Typography
          sx={{ pl: 3, pr: 1 }}
          variant="body1"
          fontSize="1.4rem"
          color={theme.palette.error.contrastText}
        >
          An Update is Available
        </Typography>
        <IconButton
          title="Ignore this version"
          onClick={() => updateService.ignoreNewRelease()}
        >
          <Close />
        </IconButton>
      </Stack>
      <Stack direction="row" alignItems="center">
        <Typography sx={{ pr: 1 }} component="span">
          {newRelease.tag_name}
        </Typography>
        <IconButton
          component="a"
          title="Open in Github"
          href={newRelease.html_url}
          target="_blank"
        >
          <GitHub />
        </IconButton>
        {downloadAsset && (
          <IconButton
            component="a"
            title="Download"
            href={downloadAsset.browser_download_url}
          >
            <Download />
          </IconButton>
        )}
      </Stack>
    </Stack>
  );

  return ReactDOM.createPortal(content, document.body);
};

export default UpdateAvailableNotification;
