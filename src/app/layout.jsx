import "./globals.css";
import "react-chat-elements/dist/main.css";

import ClientLayout from "./layout.client";

export const metadata = {
    title: "Inventory App",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <body className="h-screen w-screen overflow-hidden bg-[#020617]">
        <ClientLayout>
            {children}
        </ClientLayout>
        </body>
        </html>
    );
}
