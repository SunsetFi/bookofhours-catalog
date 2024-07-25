import React from "react";

import { Dialog, DialogTitle, DialogContent, Link } from "@mui/material";

export interface LicenseDialogProps {
  open: boolean;
  onClose: () => void;
}

const LicenseDialog: React.FC<LicenseDialogProps> = ({ open, onClose }) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Licensed under the Sixth History</DialogTitle>
      <DialogContent>
        Hush House Catalogue is an independent work by SunsetFi and is not
        affiliated with Weather Factory Ltd, Secret Histories or any related
        official content. It is published under Weather Factory’s{" "}
        <Link
          href="https://weatherfactory.biz/sixth-history-community-licence/"
          target="_blank"
        >
          Sixth History Community Licence.
        </Link>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseDialog;
