import { USER_ROLES } from "@/lib/const";
import { getParentUserContacts } from "@/queries/messages/get-parent-user-contacts";
import { getUserContacts } from "@/queries/messages/get-user-contacts";
import { QueryParams } from "@/types/hooks.types";
import { createClient } from "@/utils/supabase/client";
import { useQuery } from "@tanstack/react-query";

const SIGNED_URL_TTL = 60 * 60; // 1 hour

/** Maps a profile role to its storage bucket. */
function avatarBucket(role: string | null | undefined): string | null {
  if (role === "teacher") return "teacher-avatars";
  if (role === "parent") return "parent-avatars";
  if (role === "admin") return "admin-avatars";
  return null;
}

type RawContact = {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  avatar_url?: string | null;
};

/**
 * Resolves signed URLs for all contacts that have an avatar_url storage path.
 * Groups paths by bucket so we can batch the createSignedUrls calls.
 */
async function resolveAvatarSignedUrls(
  client: ReturnType<typeof createClient>,
  contacts: RawContact[]
): Promise<RawContact[]> {
  // Group contacts by bucket
  const byBucket = new Map<string, { contact: RawContact; path: string }[]>();
  for (const contact of contacts) {
    if (!contact.avatar_url) continue;
    const bucket = avatarBucket(contact.role);
    if (!bucket) continue;
    if (!byBucket.has(bucket)) byBucket.set(bucket, []);
    byBucket.get(bucket)!.push({ contact, path: contact.avatar_url });
  }

  // Build a map of path → signedUrl across all buckets
  const signedMap = new Map<string, string>();
  for (const [bucket, entries] of byBucket) {
    const paths = entries.map((e) => e.path);
    const { data } = await client.storage
      .from(bucket)
      .createSignedUrls(paths, SIGNED_URL_TTL);
    if (data) {
      for (const item of data) {
        if (!item.error && item.signedUrl && item.path) {
          signedMap.set(item.path, item.signedUrl);
        }
      }
    }
  }

  // Replace raw paths with signed URLs
  return contacts.map((contact) => ({
    ...contact,
    avatar_url: contact.avatar_url
      ? (signedMap.get(contact.avatar_url) ?? null)
      : null,
  }));
}

/**
 * Fetches the contacts list for the current user.
 * `params.roleFilter` narrows results by role at the query layer and is only
 * applied for non-parent callers. `params.childFilter` narrows the parent's
 * RPC-scoped contacts to one child's group teachers.
 */
function useUserContactsQuery(queryParams: QueryParams) {
  const client = createClient();
  const params = queryParams.params || {};
  const options = queryParams.options || {};
  const roleFilter = params.roleFilter;
  const childFilter = params.childFilter;
  const queryKey = [
    "user-contacts",
    params.userID ?? "",
    roleFilter ?? "all",
    childFilter ?? "all",
  ];

  const queryFn = async () => {
    let raw: RawContact[] | null | undefined;

    if (params?.userRole === USER_ROLES.PARENT) {
      raw = (await getParentUserContacts(client, childFilter)).data as RawContact[] | null;
    } else {
      raw = (await getUserContacts(client, params.userID!, roleFilter)).data as RawContact[] | null;
    }

    if (!raw) return raw;
    return resolveAvatarSignedUrls(client, raw);
  };

  return useQuery({ queryKey, queryFn, staleTime: 2 * 60 * 1000, ...options });
}

export default useUserContactsQuery;
