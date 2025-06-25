import React from "react";
import { Typography } from "@mui/material";

interface TitleProps {
  collapsed: boolean;
}

export const Title: React.FC<TitleProps> = ({ collapsed }) => {
  return collapsed ? null : (
    <Typography variant="h6" fontWeight="bold" sx={{ ml: 1 }}>
        DTC Admin
    </Typography>
  );
}; 