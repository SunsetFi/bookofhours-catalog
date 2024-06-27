import React from "react";

import { Stack, Typography } from "@mui/material";

import SelectGameContent from "@/components/LoadGameContent";

const ChooseGamePage = () => {
  return (
    <Stack
      sx={{ width: "100%", height: "100%", pt: 4 }}
      direction="column"
      alignItems="center"
    >
      <Typography variant="h1">The Hush House Catalogue</Typography>
      <SelectGameContent />
    </Stack>
  );
};

export default ChooseGamePage;
