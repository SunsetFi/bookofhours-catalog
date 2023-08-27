import * as React from "react";
import { useObservableState } from "observable-hooks";
import { of as observableOf } from "rxjs";

import {
  Box,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Typography,
} from "@mui/material";

import { useDIDependency } from "@/container";

import { useVisibleReadables } from "@/services/sh-monitor/hooks";
import { ElementStackModel } from "@/services/sh-monitor";
import { API } from "@/services/sh-api";

import { RequireLegacy } from "@/components/RequireLegacy";

const BookCatalog = () => {
  const readableModels = useVisibleReadables();

  return (
    <Box>
      <RequireLegacy />
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            <TableCell>Element</TableCell>
            <TableCell>Location</TableCell>
            <TableCell>Mastery</TableCell>
            <TableCell>Description</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {readableModels.map((book) => (
            <BookRow key={book.id} book={book} />
          ))}
          <TableRow></TableRow>
        </TableBody>
      </Table>
    </Box>
  );
};

interface BookRowProps {
  book: ElementStackModel;
}

const BookRow = ({ book }: BookRowProps) => {
  const label = useObservableState(book.label$, null);
  const description = useObservableState(book.description$, null);
  const parentTerrain = useObservableState(book.parentTerrain$, null);
  const terrainLabel = useObservableState(
    parentTerrain?.label$ ?? observableOf(null),
    null
  );

  return (
    <TableRow>
      <TableCell>
        <img src={book.iconUrl} style={{ width: "50px" }} />
      </TableCell>
      <TableCell>{label}</TableCell>
      <TableCell>{terrainLabel ?? "Unknown"}</TableCell>
      <TableCell>
        <Mystery elementStack={book} />
      </TableCell>
      <TableCell>{description}</TableCell>
    </TableRow>
  );
};

interface MysteryProps {
  elementStack: ElementStackModel;
}

const Mystery = ({ elementStack }: MysteryProps) => {
  const api = useDIDependency(API);
  const aspects = useObservableState(elementStack.elementAspects$, {});

  const masteryKey = Object.keys(aspects).find((x) => x.startsWith("mystery."));

  if (masteryKey == null) {
    return null;
  }

  return (
    <Box
      component="span"
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: 2,
      }}
    >
      <img
        style={{ width: "50px" }}
        src={`${api.baseUrl}/api/compendium/elements/${masteryKey}/icon.png`}
      />
      <Typography
        style={{ whiteSpace: "nowrap" }}
        component="span"
        variant="h4"
        color="text.secondary"
      >
        {aspects[masteryKey]}
      </Typography>
    </Box>
  );
};

export default BookCatalog;
