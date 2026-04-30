import NavBar from "@/src/components/ui/NavBar";
import SideBar from "@/src/components/ui/SideBar";

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NavBar />
      <SideBar>{children}</SideBar>
    </>
  );
}