"use client";

import { ImagePicker } from "@/components/common/ImagePicker";
import { useImagePicker } from "@/hooks/UseImagePicker";
import { userAvatarAtom } from "@/lib/store/user";
import { updateProfileAvatar } from "@/queries/users/update-profile-avatar";
import { createClient } from "@/utils/supabase/client";
import { AvatarValidationError, uploadTeacherAvatar } from "@/utils/uploadTeacherAvatar";
import { AvatarValidationError as ParentAvatarValidationError, uploadParentAvatar } from "@/utils/uploadParentAvatar";
import { AvatarValidationError as AdminAvatarValidationError, uploadAdminAvatar } from "@/utils/uploadAdminAvatar";
import {
  addToast,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/react";
import { useSetAtom } from "jotai";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { UserCircleIcon } from "@heroicons/react/24/solid";

type AvatarEditModalProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  userId: string;
  userRole: string;
  /** Current signed URL (for preview) */
  currentAvatarUrl: string | null;
  /** Called with the new signed URL after a successful save */
  onSaved: (newSignedUrl: string | null) => void;
};

/** Maps a role to its storage bucket name. */
function bucketForRole(role: string): string | null {
  if (role === "teacher") return "teacher-avatars";
  if (role === "parent") return "parent-avatars";
  if (role === "admin") return "admin-avatars";
  return null;
}

/** Uploads the avatar file to the correct bucket for the given role. */
async function uploadForRole(role: string, userId: string, file: File): Promise<string> {
  if (role === "teacher") return uploadTeacherAvatar(userId, file);
  if (role === "parent") return uploadParentAvatar(userId, file);
  if (role === "admin") return uploadAdminAvatar(userId, file);
  throw new Error("Avatar upload not supported for this role");
}

export function AvatarEditModal({
  isOpen,
  onOpenChange,
  userId,
  userRole,
  currentAvatarUrl,
  onSaved,
}: AvatarEditModalProps) {
  const t = useTranslations("UserFeedPage.FeedUser.avatarModal");
  const setUserAvatar = useSetAtom(userAvatarAtom);
  const [isSaving, setIsSaving] = useState(false);

  const {
    file: avatarFile,
    preview: avatarPreview,
    pick: pickAvatar,
    remove: removeAvatar,
    inputProps: avatarInputProps,
  } = useImagePicker(currentAvatarUrl);

  const hasChange = avatarFile !== undefined; // File or null = changed; undefined = no change

  const handleSave = async (onClose: () => void) => {
    if (!hasChange) {
      onClose();
      return;
    }

    setIsSaving(true);
    const client = createClient();

    try {
      let newPath: string | null = null;

      if (avatarFile instanceof File) {
        newPath = await uploadForRole(userRole, userId, avatarFile);
      }
      // avatarFile === null means explicit removal → newPath stays null

      // Persist the new path (or null) to profiles.avatar_url
      await updateProfileAvatar(client, userId, newPath);

      // Update Jotai store so the rest of the app reflects the change immediately
      setUserAvatar(newPath ?? "");

      // Resolve a fresh signed URL to pass back to the parent for immediate display
      let signedUrl: string | null = null;
      if (newPath) {
        const bucket = bucketForRole(userRole);
        if (bucket) {
          const { data } = await client.storage
            .from(bucket)
            .createSignedUrl(newPath, 60 * 60);
          signedUrl = data?.signedUrl ?? null;
        }
      }

      onSaved(signedUrl);
      addToast({ title: t("saveSuccess"), color: "success" });
      onClose();
    } catch (err) {
      if (
        err instanceof AvatarValidationError ||
        err instanceof ParentAvatarValidationError ||
        err instanceof AdminAvatarValidationError
      ) {
        addToast({ title: err.message, color: "warning" });
      } else {
        addToast({ title: t("saveError"), color: "danger" });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="center">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>{t("title")}</ModalHeader>
            <ModalBody className="items-center pb-2">
              <ImagePicker
                preview={avatarPreview}
                fallbackIcon={UserCircleIcon}
                fallbackIconClassName="w-16 h-16 text-default-300"
                shape="circle"
                labels={{
                  add: t("add"),
                  change: t("change"),
                  remove: t("remove"),
                  label: t("label"),
                }}
                onPick={pickAvatar}
                onRemove={removeAvatar}
                inputProps={avatarInputProps}
              />
              <p className="text-small text-default-500 text-center px-4">
                {t("hint")}
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="flat"
                onPress={onClose}
                isDisabled={isSaving}
              >
                {t("cancel")}
              </Button>
              <Button
                color="primary"
                onPress={() => handleSave(onClose)}
                isLoading={isSaving}
                isDisabled={!hasChange}
              >
                {t("save")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
