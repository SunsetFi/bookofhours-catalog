import React from "react";
import { useNavigate } from "react-router";

import {
  Dialog,
  DialogContent,
  TextField,
  Typography,
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  IconButton,
} from "@mui/material";

import { Search as SearchIcon } from "@mui/icons-material";

import sitemap, { isSiteMapNavItem } from "@/sitemap";

import { useDIDependency } from "@/container";

import { useHistory } from "@/services/history";
import { SearchService, SearchItemResult } from "@/services/search";

import { useObservation } from "@/hooks/use-observation";

const SearchDialog = () => {
  const navigate = useNavigate();

  const searchService = useDIDependency(SearchService);
  const isOpen = useObservation(searchService.isOpen$);
  const searchQuery = useObservation(searchService.searchQuery$) ?? "";
  const searchResults = useObservation(searchService.searchResults$) ?? [];

  const hasQuery = searchQuery != "";

  const onTextFieldMount = React.useCallback(
    (ref: HTMLDivElement) => {
      if (isOpen && ref) {
        ref.focus();
      }
    },
    [isOpen]
  );

  const firstItem = searchResults[0];
  const onTextFieldKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      if (!firstItem) {
        return;
      }

      searchService.close();

      navigate(firstItem.path);
    },
    [searchService, firstItem ?? null]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open
      onClose={() => searchService.close()}
      fullWidth
      maxWidth="md"
      // I dont know why this needs to be disabled for autoFocus to work, but it apparently does.
      // FIXME: We definitely dont want disableRestoreFocus if we are making this arrow key + screen reader accessible.
      disableRestoreFocus
      sx={{
        pt: 10,
        "& .MuiDialog-container": {
          alignItems: "flex-start",
        },
      }}
    >
      <Box
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          p: 2,
          py: 4,
          gap: 1,
        }}
      >
        <SearchIcon fontSize="large" color="primary" />
        <TextField
          ref={onTextFieldMount}
          onKeyDown={onTextFieldKeyDown}
          sx={{ ml: 1 }}
          autoFocus
          fullWidth
          variant="standard"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => searchService.setSearchQuery(e.target.value)}
        />
        <Typography
          sx={{
            ml: 1,
            borderRadius: 2,
            px: 1,
            py: 0.6,
            backgroundColor: "rgba(0, 0, 0, 0.3)",
          }}
          variant="caption"
          fontWeight="bold"
        >
          esc
        </Typography>
      </Box>
      <Divider />
      <DialogContent>
        {!hasQuery && (
          <Typography sx={{ width: "100%", textAlign: "center" }} variant="h5">
            Type a query to search
          </Typography>
        )}
        {hasQuery && searchResults.length === 0 && (
          <Typography sx={{ width: "100%", textAlign: "center" }} variant="h5">
            No results found
          </Typography>
        )}
        {searchQuery != "" && (
          <List component="nav" sx={{ pt: 1 }}>
            {searchResults.map((item, i) => (
              <SearchResultListItem key={i} item={item} />
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SearchResultListItem = ({ item }: { item: SearchItemResult }) => {
  const { iconUrl, label, path } = item;

  let secondaryText: string | undefined = undefined;
  const pathItem = sitemap
    .filter(isSiteMapNavItem)
    .find((x) => x.path === item.path);
  if (pathItem) {
    secondaryText = pathItem.label;
  }

  const navigate = useNavigate();
  const searchService = useDIDependency(SearchService);
  const history = useHistory();
  const href = React.useMemo(() => history.createHref(path), [history, path]);

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      searchService.close();
      navigate(path);
    },
    [path, searchService, navigate]
  );

  let actions: React.ReactNode | null = null;
  if (item.actions) {
    actions = (
      <Stack direction="row" sx={{ ml: "auto" }}>
        {item.actions.map((action, i) => (
          <IconButton key={i} onClick={action.onClick}>
            {action.icon}
          </IconButton>
        ))}
      </Stack>
    );
  }

  return (
    <ListItemButton component="a" href={href} onClick={onClick}>
      <ListItemIcon>
        <img
          loading="lazy"
          src={iconUrl}
          alt={label}
          style={{
            display: "block",
            maxWidth: "40px",
          }}
        />
      </ListItemIcon>
      <ListItemText primary={label} secondary={secondaryText} />
      {actions}
    </ListItemButton>
  );
};

export default SearchDialog;
