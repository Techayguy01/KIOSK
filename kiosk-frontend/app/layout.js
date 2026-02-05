import "./globals.css";

export const metadata = {
    title: "Hotel Kiosk",
    description: "Self-service hotel kiosk application",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
