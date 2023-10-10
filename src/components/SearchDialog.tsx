import * as React from "react";
import { useNavigate } from "react-router";

import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";

import SearchIcon from "@mui/icons-material/Search";

import { useDIDependency } from "@/container";
import { useObservation } from "@/hooks/use-observation";

import { SearchService, SearchItemResult } from "@/services/search";
import { useHistory } from "@/services/history";

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

  const onTextFieldKeyDown = React.useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== "Enter") {
        return;
      }

      e.preventDefault();
      e.stopPropagation();

      const firstItem = searchResults[0];
      if (!firstItem) {
        return;
      }

      searchService.close();
      navigate(firstItem.path);
    },
    [searchService, searchResults]
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
              <SearchResultItem key={i} {...item} />
            ))}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

const SearchResultItem = ({
  iconUrl,
  label,
  path,
  pathQuery,
}: SearchItemResult) => {
  const navigate = useNavigate();
  const searchService = useDIDependency(SearchService);
  const history = useHistory();
  const href = React.useMemo(
    () => history.createHref(`${path}?${pathQuery}`),
    [history, path, pathQuery]
  );

  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      searchService.close();
      navigate(`${path}?${pathQuery}`);
    },
    [path, pathQuery, searchService, navigate]
  );

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
      <ListItemText primary={label} secondary={path} />
    </ListItemButton>
  );
};

export default SearchDialog;
