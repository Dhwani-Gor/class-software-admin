import "./globals.css";
import AppLayout from "@/Layout/AppLayout";

export const metadata = {
  title: "MARINE ASSURE",
  description: "MARINE ASSURE",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  );
}
