import * as React from "react";
import { Navigate } from "react-router-dom";

import Box from "@mui/material/Box";
import { useQueryString } from "@/hooks/use-querystring";

import PageContainer from "@/components/PageContainer";

const GameplayView = () => {
  const redirect = useQueryString("redirect");
  return (
    <PageContainer title="Inventory of Hush House">
      <Box
        sx={{
          p: 2,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {redirect != null && <Navigate to={redirect} />}
      </Box>
    </PageContainer>
  );
};

export default GameplayView;
