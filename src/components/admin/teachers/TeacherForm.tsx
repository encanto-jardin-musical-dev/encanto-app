"use client";
import { Database } from "@/types/database.types";
import { getAllGroups } from "@/queries/users/get-all-groups";
import { createClient } from "@/utils/supabase/client";
import { Input, Select, SelectItem } from "@heroui/react";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useImagePicker } from "@/hooks/UseImagePicker";
import { ImagePicker } from "@/components/common/ImagePicker";
import { EntityMultiSelect } from "@/components/common/EntityMultiSelect";

// Adult document types (children-only types like rc/ti are excluded)
const ADULT_DOC_TYPES: Database["public"]["Enums"]["document_type"][] = [
  "cc",
  "passport",
  "international_id",
  "other",
];

type GroupOption = { id: string; name: string };

export type TeacherFormValues = {
  first_name: string;
  last_name: string;
  document_type: Database["public"]["Enums"]["document_type"];
  document_number: string;
  role: Database["public"]["Enums"]["user_role"];
  email: string;
  phone: string;
  groupIds: string[];
  /**
   * Avatar state:
   * - `undefined`  → no change (keep existing avatar_url)
   * - `File`       → new image to upload
   * - `null`       → remove existing avatar
   */
  avatarFile: File | null | undefined;
};

export type TeacherFormRef = {
  submit: () => boolean;
  getValues: () => TeacherFormValues;
};

type TeacherFormProps = {
  mode?: "create" | "edit";
  defaultValues?: Partial<TeacherFormValues> & { existingAvatarUrl?: string | null };
  onSubmit: (values: TeacherFormValues) => void;
};

const TeacherForm = forwardRef<TeacherFormRef, TeacherFormProps>(
  ({ mode = "create", defaultValues, onSubmit }, ref) => {
    const t = useTranslations("AdminTeachers.form");
    const [groups, setGroups] = useState<GroupOption[]>([]);

    const [firstName, setFirstName] = useState(defaultValues?.first_name ?? "");
    const [lastName, setLastName] = useState(defaultValues?.last_name ?? "");
    const [docType, setDocType] = useState<Database["public"]["Enums"]["document_type"]>(
      defaultValues?.document_type ?? "cc"
    );
    const [docNumber, setDocNumber] = useState(defaultValues?.document_number ?? "");
    const [role, setRole] = useState<Database["public"]["Enums"]["user_role"]>(
      defaultValues?.role ?? "teacher"
    );
    const [email, setEmail] = useState(defaultValues?.email ?? "");
    const [phone, setPhone] = useState(defaultValues?.phone ?? "");
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
      defaultValues?.groupIds ?? []
    );

    const {
      file: avatarFile,
      preview: avatarPreview,
      pick: pickAvatar,
      remove: removeAvatar,
      inputProps: avatarInputProps,
    } = useImagePicker(defaultValues?.existingAvatarUrl ?? null);

    const [errors, setErrors] = useState<Partial<Record<keyof TeacherFormValues, string>>>({});

    useEffect(() => {
      const client = createClient();
      getAllGroups(client).then(({ data }) => {
        if (!data) return;
        setGroups(data.map((g) => ({ id: g.id, name: g.name })));
      });
    }, []);

    useImperativeHandle(ref, () => ({
      submit: () => {
        const newErrors: typeof errors = {};
        if (!firstName.trim()) newErrors.first_name = "required";
        if (!lastName.trim()) newErrors.last_name = "required";
        if (!docNumber.trim()) newErrors.document_number = "required";
        if (mode === "create" && !email.trim()) newErrors.email = "required";
        if (mode === "create" && email.trim() && !email.includes("@")) {
          newErrors.email = "invalid";
        }
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return false;
        onSubmit({
          first_name: firstName,
          last_name: lastName,
          document_type: docType,
          document_number: docNumber,
          role,
          email,
          phone,
          groupIds: selectedGroupIds,
          avatarFile,
        });
        return true;
      },
      getValues: () => ({
        first_name: firstName,
        last_name: lastName,
        document_type: docType,
        document_number: docNumber,
        role,
        email,
        phone,
        groupIds: selectedGroupIds,
        avatarFile,
      }),
    }));

    return (
      <div className="flex flex-col gap-4">
        {/* Avatar picker */}
        <ImagePicker
          preview={avatarPreview}
          fallbackIcon={UserCircleIcon}
          fallbackIconClassName="w-16 h-16 text-default-300"
          shape="circle"
          labels={{
            add: t("avatar.add"),
            change: t("avatar.change"),
            remove: t("avatar.remove"),
            label: t("avatar.label"),
          }}
          onPick={pickAvatar}
          onRemove={removeAvatar}
          inputProps={avatarInputProps}
        />

        {/* Email — create-only, required */}
        {mode === "create" && (
          <Input
            type="email"
            label={t("email.label")}
            placeholder={t("email.placeholder")}
            value={email}
            onValueChange={setEmail}
            isInvalid={!!errors.email}
            isRequired
          />
        )}

        {/* ID */}
        <div className="flex gap-2">
          <Select
            label={t("idType.label")}
            placeholder={t("idType.placeholder")}
            selectedKeys={[docType]}
            onSelectionChange={(keys) =>
              setDocType([...keys][0] as Database["public"]["Enums"]["document_type"])
            }
            className="w-36 shrink-0"
          >
            {ADULT_DOC_TYPES.map((dt) => (
              <SelectItem key={dt} textValue={t(`idType.${dt}`)}>
                {t(`idType.${dt}`)}
              </SelectItem>
            ))}
          </Select>
          <Input
            label={t("idNumber.label")}
            placeholder={t("idNumber.placeholder")}
            value={docNumber}
            onValueChange={setDocNumber}
            isInvalid={!!errors.document_number}
            className="flex-1"
          />
        </div>

        {/* Names */}
        <Input
          label={t("names.label")}
          placeholder={t("names.placeholder")}
          value={firstName}
          onValueChange={setFirstName}
          isInvalid={!!errors.first_name}
        />

        {/* Last names */}
        <Input
          label={t("lastNames.label")}
          placeholder={t("lastNames.placeholder")}
          value={lastName}
          onValueChange={setLastName}
          isInvalid={!!errors.last_name}
        />

        {/* Role */}
        <Select
          label={t("role.label")}
          placeholder={t("role.placeholder")}
          selectedKeys={[role]}
          onSelectionChange={(keys) =>
            setRole([...keys][0] as Database["public"]["Enums"]["user_role"])
          }
        >
          <SelectItem key="teacher" textValue={t("role.teacher")}>
            {t("role.teacher")}
          </SelectItem>
        </Select>

        {/* Phone (optional) */}
        <Input
          type="tel"
          label={t("phone.label")}
          placeholder={t("phone.placeholder")}
          value={phone}
          onValueChange={setPhone}
        />

        {/* Groups (optional) */}
        {groups.length > 0 && (
          <EntityMultiSelect
            items={groups}
            selectedIds={selectedGroupIds}
            onChange={setSelectedGroupIds}
            getId={(g) => g.id}
            getLabel={(g) => g.name}
            label={t("groups.label")}
            placeholder={t("groups.placeholder")}
          />
        )}
      </div>
    );
  }
);

TeacherForm.displayName = "TeacherForm";

export { TeacherForm };
