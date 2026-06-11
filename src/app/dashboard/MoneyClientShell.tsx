"use client";

import { useCallback, useEffect, useState } from "react";
import GroupClient from "@/app/group/[id]/GroupClient";
import type { PublicUser } from "@/lib/current-user";
import type { GroupListItem } from "@/lib/money-types";
import {
  getDashboardPath,
  getGroupPath,
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

  return (
    <DashboardClient
      initialGroups={initialGroups}
      user={user}
      onOpenGroup={openGroup}
    />
  );
}
