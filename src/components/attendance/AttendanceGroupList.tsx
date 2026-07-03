"use client";
import { AdminSearchBar } from "@/components/common/AdminSearchBar";
import { EntityListItemLink } from "@/components/common/EntityListItemLink";
import useAttendanceGroupsQuery from "@/hooks/UseAttendanceGroupsQuery";
import useAvailableTeachersQuery from "@/hooks/UseAvailableTeachersQuery";
import { USER_ROLES } from "@/lib/const";
import { userAtom } from "@/lib/store/user";
import { normalizeSearchText } from "@/utils/text";
import { PhotoIcon } from "@heroicons/react/24/outline";
import { Select, SelectItem, Skeleton } from "@heroui/react";
import { useAtomValue } from "jotai";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

const SKELETON_COUNT = 4;

function GroupListSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
        <div key={i} className="bg-default-100 rounded-lg p-2 flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <Skeleton className="h-3.5 w-2/5 rounded-md" />
        </div>
      ))}
    </>
  );
}

export function AttendanceGroupList() {
  const t = useTranslations("Attendance.picker");
  const user = useAtomValue(userAtom);
  const isAdmin = user.role === USER_ROLES.ADMIN;

  const [search, setSearch] = useState("");
  const [teacherId, setTeacherId] = useState<string | undefined>(undefined);

  const { data: teachers } = useAvailableTeachersQuery(isAdmin);

  const effectiveTeacherId = isAdmin ? teacherId : user.id;
  const { data: groups, isPending } = useAttendanceGroupsQuery(effectiveTeacherId);

  const filteredGroups = useMemo(() => {
    const query = normalizeSearchText(search.trim());
    if (!query) return groups ?? [];
    return (groups ?? []).filter((group) => normalizeSearchText(group.name).includes(query));
  }, [groups, search]);

  return (
    <div className="flex flex-col gap-3 overflow-hidden h-full">
      <div className="flex flex-col gap-3">
        <AdminSearchBar onSearch={setSearch} placeholder={t("searchPlaceholder")} />
        {isAdmin && (
          <Select
            aria-label={t("teacherFilterLabel")}
            placeholder={t("teacherFilterAll")}
            selectedKeys={teacherId ? new Set([teacherId]) : new Set()}
            onSelectionChange={(keys) => {
              const [first] = [...keys];
              setTeacherId(first ? String(first) : undefined);
            }}
          >
            {(teachers ?? []).map((teacher) => (
              <SelectItem key={teacher.id} textValue={`${teacher.first_name} ${teacher.last_name}`}>
                {teacher.first_name} {teacher.last_name}
              </SelectItem>
            ))}
          </Select>
        )}
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto">
        {isPending ? (
          <GroupListSkeleton />
        ) : filteredGroups.length === 0 ? (
          <p className="text-center text-default-500 py-8">{t("empty")}</p>
        ) : (
          filteredGroups.map((group) => (
            <EntityListItemLink
              key={group.id}
              href={`/attendance/${group.id}`}
              imageUrl={group.image_url}
              fallbackIcon={PhotoIcon}
              fallbackIconClassName="w-6 h-6 text-default-400"
              title={group.name}
              variant="card"
            />
          ))
        )}
      </div>
    </div>
  );
}
