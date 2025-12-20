import { RequireAuth } from "@/lib/auth/guards";
import { AccountSidebar } from "@/components/layout/AccountSidebar";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAuth>
      <div className="flex min-h-screen">
        <AccountSidebar />
        <main className="flex-1 bg-linear-to-b from-[#f5fff7] via-white to-[#eefbf1] md:ml-0 pt-16 md:pt-0">
          {children}
        </main>
      </div>
    </RequireAuth>
  );
}

