import * as React from "react";
import { BehaviorSubject, debounceTime } from "rxjs";

import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import { useObservation } from "@/observables";

import { FilterComponentProps } from "./types";

export const TextFilter = ({
  filterValue,
  onChange,
}: FilterComponentProps<string | null, string | null>) => {
  // Theres probably a cleaner way to do this, but currently rxjs is my hammer and this looks pretty nail shaped to me.
  const localValue$ = React.useMemo(
    () => new BehaviorSubject<string | null>(null),
    []
  );
  const localValue = useObservation(localValue$);
  React.useEffect(() => {
    const subscription = localValue$
      .pipe(debounceTime(1000))
      .subscribe((value) => {
        if (value !== null) {
          if (value === "") {
            onChange(null);
          } else {
            onChange(value);
          }
          localValue$.next(null);
        }
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
    >
      <Box
        sx={{
          pt: 1,
          px: 1,
          display: "flex",
          flexDirection: "row",
          width: "100%",
        }}
      >
        <Button size="small" onClick={() => onChange(null)}>
          Clear
        </Button>
      </Box>
      <TextField
        sx={{ m: 1 }}
        autoFocus
        label="Search"
        value={localValue}
        onChange={(e) => localValue$.next(e.target.value)}
      />
    </Box>
  );
};
