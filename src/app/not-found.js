import { Box, Typography } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
    return (
        <Box
            sx={{
                height: "100vh",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                textAlign: "center",
            }}
        >
            <Typography sx={{ fontSize: 120, fontWeight: "bold" }}>
                404
            </Typography>
            <Typography sx={{ fontSize: 50 }}>Not Found</Typography>
            <Link href={"/dashboard"}>Go to home page</Link>
        </Box>
    );
}
