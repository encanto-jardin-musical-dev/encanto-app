"use client";

import { userCurrentSelectionAtom, userRoleAtom } from "@/lib/store/user";
import { useAtom } from "jotai";
import FeedFilters from "./FeedFilters";
import { createClient } from "@/utils/supabase/client";
import { useCallback, useEffect } from "react";
import { groupTasksAtom } from "@/lib/store/feed";

const supabase = createClient();

export default function GroupFeed() {
  const [selectedContext] = useAtom(userCurrentSelectionAtom);
  const [userRole] = useAtom(userRoleAtom);
  const [groupTasks, setGroupTasks] = useAtom(groupTasksAtom);

  const getGroupId = useCallback(async () => {
    const selectedValue = selectedContext as Set<string | number>;
    if (userRole === "parent") {
      const { data } = await supabase
        .from("child_groups")
        .select("group_id")
        .eq("child_id", selectedValue.values().next().value)
        .single();

      const groupId = data ? data?.group_id : null;
      return groupId;
    }
    return selectedValue.values().next().value;
  }, [userRole, selectedContext]);

  const getGroupTasks = useCallback(async () => {
    const groupId = await getGroupId();
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("group_id", groupId);
    if (data) {
      setGroupTasks(data);
    }

    return data;
  }, [getGroupId, setGroupTasks]);

  useEffect(() => {
    if (selectedContext) {
      getGroupTasks();
    }
  }, [selectedContext, getGroupTasks]);

  return (
    <>
      <FeedFilters />
      <div className="w-full flex flex-col gap-4">
        {Array.isArray(groupTasks)
          ? groupTasks.map((task) => (
              <div key={task.id}>
                <h3 className="text-xl font-bold">{task.title}</h3>
                <p>{task.description}</p>
              </div>
            ))
          : []}
      </div>
    </>
  );
}
