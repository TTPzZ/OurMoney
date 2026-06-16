"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import GroupClient from "@/app/group/[id]/GroupClient";
import ProfileClient from "@/app/profile/ProfileClient";
import type { PublicUser } from "@/lib/current-user";
import type { GroupListItem } from "@/lib/money-types";
import {
  getDashboardPath,
  getGroupPath,
  getProfilePath,
  getMoneyViewFromPathname,
  type MoneyShellState,
} from "@/lib/money-shell-state";
import DashboardClient from "./DashboardClient";

export default function MoneyClientShell({
  initialGroups,
  user,
  userId,
}: {
  initialGroups: GroupListItem[];
  user: PublicUser;
  userId: string;
}) {
  const [shellState, setShellState] = useState<MoneyShellState>({
    view: "dashboard",
    selectedGroupId: null,
  });

  const openGroup = useCallback((groupId: string) => {
    const path = getGroupPath(groupId);
    setShellState({ view: "group", selectedGroupId: groupId });

    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, []);

  const openProfile = useCallback(() => {
    const path = getProfilePath();
    setShellState({ view: "profile", selectedGroupId: null });

    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, []);

  const openDashboard = useCallback(() => {
    const path = getDashboardPath();
    setShellState({ view: "dashboard", selectedGroupId: null });

    if (window.location.pathname !== path) {
      window.history.pushState(null, "", path);
    }
  }, []);

  useEffect(() => {
    const syncFromLocation = () => {
      setShellState(getMoneyViewFromPathname(window.location.pathname));
    };

    syncFromLocation();
    window.addEventListener("popstate", syncFromLocation);

    return () => {
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  if (shellState.view === "group" && shellState.selectedGroupId) {
    return (
      <GroupClient
        groupId={shellState.selectedGroupId}
        userId={userId}
        onBackToDashboard={openDashboard}
      />
    );
  }

  if (shellState.view === "profile") {
    return (
      <main className="min-h-screen bg-gray-50 flex flex-col items-center p-4">
        {/* Header */}
        <div className="w-full max-w-md flex justify-between items-center mb-8 pt-4">
          <button 
            onClick={openDashboard} 
            className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 text-gray-500 active:scale-95 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Hồ sơ cá nhân</h1>
          <div className="w-10"></div>
        </div>

        <ProfileClient initialUser={user} />
      </main>
    );
  }

  return (
    <DashboardClient
      initialGroups={initialGroups}
      user={user}
      onOpenGroup={openGroup}
      onOpenProfile={openProfile}
    />
  );
}
