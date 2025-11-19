import { RequireAdmin } from "@/lib/auth/guards";
import { AdminSidebar } from "@/components/layout/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RequireAdmin>
      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1">{children}</main>
      </div>
    </RequireAdmin>
  );
}

