import NavBar from "@/src/components/ui/NavBar";

export default function UploadLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-sans text-white min-h-screen max-w-7xl mx-auto px-6">
      <NavBar className="sticky top-0 z-50" />
        {children}
    </div>
  );
}
