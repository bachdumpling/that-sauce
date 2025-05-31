const defaultUrl = process.env.NEXT_PUBLIC_CLIENT_URL
  ? `https://${process.env.NEXT_PUBLIC_CLIENT_URL}`
  : "https://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Sanity Studio - That Sauce",
  description: "Content management studio for That Sauce",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="absolute inset-0 h-screen w-screen overflow-hidden">
      {/* Full screen studio - no navigation or footer */}
      {children}
    </div>
  );
}
