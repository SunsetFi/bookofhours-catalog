import * as React from "react";
import { Navigate } from "react-router-dom";

import Link from "@mui/material/Link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import GithubIcon from "@mui/icons-material/GitHub";

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
        <Link
          sx={{
            mt: "auto",
            justifySelf: "center",
            alignSelf: "flex-end",
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            textDecoration: "none",
          }}
          href="https://github.com/SunsetFi/bookofhours-catalog"
          target="_blank"
        >
          <GithubIcon fontSize="large" sx={{ mr: 1 }} />
          <Typography variant="h6">View Project on Github</Typography>
        </Link>
      </Box>
    </PageContainer>
  );
};

export default GameplayView;
