"use client";

import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  ChevronDown,
  ClipboardCheck,
  LogOut,
  LayoutDashboard,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useAuth } from "@/components/auth/auth-provider";
import type { AdminUser } from "@/lib/auth/storage";

type NavigationLabel =
  | "Dashboard"
  | "Assessments"
  | "Search"
  | "Data Dictionary"
  | "Experts"
  | "Team"
  | "Trash"
  | "Settings";

type NavigationItem = {
  href: string;
  icon: LucideIcon;
  label: NavigationLabel;
};

const navigationItems: readonly NavigationItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Assessments", href: "/assessments", icon: ClipboardCheck },
  { label: "Search", href: "#search", icon: Search },
  { label: "Data Dictionary", href: "/data-dictionary", icon: BookOpen },
  { label: "Experts", href: "/experts", icon: Users },
  { label: "Team", href: "#team", icon: UserRound },
  { label: "Trash", href: "#trash", icon: Trash2 },
  { label: "Settings", href: "#settings", icon: Settings },
];

export function AdminShell({
  activeItem,
  children,
}: {
  activeItem: NavigationLabel;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white text-[#171717]">
      <div className="grid min-h-screen lg:grid-cols-[220px_minmax(0,1fr)]">
        <Sidebar activeItem={activeItem} />
        <section className="min-w-0 bg-white">
          <div className="px-4 py-8 sm:px-6 lg:mr-[18px] lg:ml-6 lg:max-w-none lg:px-0">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

function Sidebar({ activeItem }: { activeItem: NavigationLabel }) {
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const adminName = getAdminDisplayName(user);
  const adminEmail = user?.email_id?.trim() || "Admin console";
  const initials = getAdminInitials(user);
  const profileImageUrl = getAdminProfileImageUrl(user);

  function handleLogout() {
    setShowProfileMenu(false);
    logout();
    router.replace("/login");
  }

  return (
    <aside className="hidden border-r border-black/[0.08] bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
      <div className="flex h-14 shrink-0 items-center gap-2 border-b border-black/[0.08] px-5">
        <div className="flex size-7 items-center justify-center rounded-md bg-black text-white">
          <ShieldCheck size={16} aria-hidden="true" />
        </div>
        <p className="text-[15px] leading-none font-bold">Admin Panel</p>
      </div>

      <nav className="space-y-1 px-3 py-4" aria-label="Primary navigation">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const active = item.label === activeItem;
          const className = `flex h-9 items-center gap-3 rounded-md px-3 text-sm font-bold transition ${
            active
              ? "bg-[#007AFF] text-white"
              : "text-[#555555] hover:bg-black/[0.04] hover:text-[#171717]"
          }`;

          if (item.href.startsWith("#")) {
            return (
              <a key={item.label} href={item.href} className={className}>
                <Icon size={15} aria-hidden="true" />
                {item.label}
              </a>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href}
              className={className}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={15} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative mt-auto border-t border-black/[0.08] p-4">
        {showProfileMenu ? (
          <div className="absolute right-3 bottom-[72px] left-3 rounded-md border border-black/[0.08] bg-white p-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)]">
            <button
              type="button"
              className="flex h-9 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-bold text-[#EF4444] transition hover:bg-[#FEF2F2]"
              onClick={handleLogout}
            >
              <LogOut size={14} aria-hidden="true" />
              Logout
            </button>
          </div>
        ) : null}

        <button
          type="button"
          className="flex w-full items-center gap-3 rounded-md text-left"
          aria-expanded={showProfileMenu}
          aria-haspopup="menu"
          onClick={() => setShowProfileMenu((currentValue) => !currentValue)}
        >
          <AdminAvatar initials={initials} name={adminName} profileImageUrl={profileImageUrl} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{adminName}</p>
            <p className="truncate text-xs text-[#86868B]">{adminEmail}</p>
          </div>
          <ChevronDown
            size={14}
            className={`shrink-0 text-[#86868B] transition ${showProfileMenu ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </aside>
  );
}

function getAdminDisplayName(user: AdminUser | null) {
  const fullName = [user?.first_name, user?.last_name]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" ");

  if (fullName) {
    return fullName;
  }

  const emailName = user?.email_id
    ?.split("@")[0]
    ?.replace(/[._-]+/g, " ")
    .trim();

  return emailName || "Admin User";
}

function getAdminInitials(user: AdminUser | null) {
  const nameParts = [user?.first_name, user?.last_name]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  if (nameParts.length > 0) {
    return nameParts
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }

  const email = user?.email_id?.trim();

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return "AD";
}

function AdminAvatar({
  initials,
  name,
  profileImageUrl,
}: {
  initials: string;
  name: string;
  profileImageUrl: string;
}) {
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const shouldShowImage = Boolean(profileImageUrl) && failedImageUrl !== profileImageUrl;

  if (shouldShowImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt={`${name} profile`}
        className="size-8 shrink-0 rounded-full border border-black/[0.06] object-cover"
        height={32}
        onError={() => setFailedImageUrl(profileImageUrl)}
        referrerPolicy="no-referrer"
        src={profileImageUrl}
        width={32}
      />
    );
  }

  return (
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#007AFF] text-xs font-bold text-white">
      {initials}
    </div>
  );
}

function getAdminProfileImageUrl(user: AdminUser | null) {
  return user?.profile_pic_url?.trim() || user?.profilePicUrl?.trim() || "";
}
