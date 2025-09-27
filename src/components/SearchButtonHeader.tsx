import React from "react";

import { Box, Typography, SxProps } from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import { useDIDependency } from "@/container";

import { SearchService } from "@/services/search";

export interface SearchButtonHeaderProps {
  sx?: SxProps;
}

const SearchButtonHeader = ({ sx }: SearchButtonHeaderProps) => {
  const searchService = useDIDependency(SearchService);
  const onClick = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      searchService.open();
    },
    [searchService],
  );

  return (
    <Box
      onClick={onClick}
      sx={{
        borderRadius: 4,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        height: "40px",
        display: "flex",
        alignItems: "center",
        cursor: "pointer",
        p: 1,
        gap: 1,
        ...sx,
      }}
    >
      <SearchIcon />
      <Typography variant="body1" sx={{ textAlign: "center" }}>
        Search
      </Typography>
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
        Ctrl+K
      </Typography>
    </Box>
  );
};

export default SearchButtonHeader;
