"use client";
import { Database } from "@/types/database.types";
import { ChildLinkEntry } from "@/queries/parents/get-parent-by-id";
import { getAvailableChildren, ChildOption } from "@/queries/parents/get-available-children";
import { createClient } from "@/utils/supabase/client";
import { Button, Input, Radio, RadioGroup, Select, SelectItem } from "@heroui/react";
import { XCircleIcon, UserCircleIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useImagePicker } from "@/hooks/UseImagePicker";
import { ImagePicker } from "@/components/common/ImagePicker";

// Adult document types (children-only types like rc/ti are excluded)
const ADULT_DOC_TYPES: Database["public"]["Enums"]["document_type"][] = [
  "cc",
  "passport",
  "international_id",
  "other",
];

const RELATIONSHIPS: Database["public"]["Enums"]["guardian_relationship"][] = [
  "mother",
  "father",
  "other",
];

export type ParentFormValues = {
  first_name: string;
  last_name: string;
  document_type: Database["public"]["Enums"]["document_type"];
  document_number: string;
  email: string;
  phone: string;
  children: ChildLinkEntry[];
  /**
   * Avatar state:
   * - `undefined`  → no change (keep existing avatar_url)
   * - `File`       → new image to upload
   * - `null`       → remove existing avatar
   */
  avatarFile: File | null | undefined;
};

export type ParentFormRef = {
  submit: () => boolean;
  getValues: () => ParentFormValues;
};

type ParentFormProps = {
  mode?: "create" | "edit";
  defaultValues?: Partial<ParentFormValues> & { existingAvatarUrl?: string | null };
  onSubmit: (values: ParentFormValues) => void;
};

const ParentForm = forwardRef<ParentFormRef, ParentFormProps>(
  ({ mode = "create", defaultValues, onSubmit }, ref) => {
    const t = useTranslations("AdminParents.form");
    const [children, setChildren] = useState<ChildOption[]>([]);

    const [firstName, setFirstName] = useState(defaultValues?.first_name ?? "");
    const [lastName, setLastName] = useState(defaultValues?.last_name ?? "");
    const [docType, setDocType] = useState<Database["public"]["Enums"]["document_type"]>(
      defaultValues?.document_type ?? "cc"
    );
    const [docNumber, setDocNumber] = useState(defaultValues?.document_number ?? "");
    const [email, setEmail] = useState(defaultValues?.email ?? "");
    const [phone, setPhone] = useState(defaultValues?.phone ?? "");
    const [selectedChildren, setSelectedChildren] = useState<ChildLinkEntry[]>(
      defaultValues?.children ?? []
    );

    const {
      file: avatarFile,
      preview: avatarPreview,
      pick: pickAvatar,
      remove: removeAvatar,
      inputProps: avatarInputProps,
    } = useImagePicker(defaultValues?.existingAvatarUrl ?? null);

    const [errors, setErrors] = useState<Partial<Record<keyof ParentFormValues, string>>>({});

    useEffect(() => {
      const client = createClient();
      getAvailableChildren(client).then((data) => setChildren(data));
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
        // Validate each child row has both child_id and relationship
        const hasInvalidRow = selectedChildren.some((c) => !c.child_id || !c.relationship);
        if (hasInvalidRow) newErrors.children = "invalid";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return false;
        onSubmit({
          first_name: firstName,
          last_name: lastName,
          document_type: docType,
          document_number: docNumber,
          email,
          phone,
          children: selectedChildren,
          avatarFile,
        });
        return true;
      },
      getValues: () => ({
        first_name: firstName,
        last_name: lastName,
        document_type: docType,
        document_number: docNumber,
        email,
        phone,
        children: selectedChildren,
        avatarFile,
      }),
    }));

    // Helpers for the child list
    const addChildRow = () => {
      const usedIds = new Set(selectedChildren.map((c) => c.child_id));
      const next = children.find((c) => !usedIds.has(c.id));
      if (!next) return;
      setSelectedChildren((prev) => [
        ...prev,
        { child_id: next.id, relationship: "other" },
      ]);
    };

    const updateChildId = (index: number, child_id: string) => {
      setSelectedChildren((prev) =>
        prev.map((c, i) => (i === index ? { ...c, child_id } : c))
      );
    };

    const updateChildRelationship = (
      index: number,
      relationship: Database["public"]["Enums"]["guardian_relationship"]
    ) => {
      setSelectedChildren((prev) =>
        prev.map((c, i) => (i === index ? { ...c, relationship } : c))
      );
    };

    const removeChild = (index: number) => {
      setSelectedChildren((prev) => prev.filter((_, i) => i !== index));
    };

    // Children already used in other rows (to avoid duplicates)
    const usedChildIds = (excludeIndex: number) =>
      new Set(selectedChildren.filter((_, i) => i !== excludeIndex).map((c) => c.child_id));

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

        {/* Phone (optional) */}
        <Input
          type="tel"
          label={t("phone.label")}
          placeholder={t("phone.placeholder")}
          value={phone}
          onValueChange={setPhone}
        />

        {/* Children links */}
        <div className="flex flex-col gap-2">
          <span className="text-small font-medium text-foreground">{t("children.label")}</span>

          <div className="flex flex-col gap-5 w-[96%]">
            {selectedChildren.length === 0 && (
              <p className="text-small text-default-500 py-1">{t("children.noChildren")}</p>
            )}
            {/* Wait for children to load before rendering pickers */}
            {children.length > 0 &&
              selectedChildren.map((entry, index) => {
                const excluded = usedChildIds(index);
                const available = children.filter((c) => !excluded.has(c.id));

                return (
                  <div
                    key={index}
                    className="relative flex flex-col gap-1 pt-4 px-2 pb-2 rounded-lg border border-divider"
                  >
                    {/* Remove button — top-right corner */}
                    <button
                      type="button"
                      aria-label={t("children.remove")}
                      onClick={() => removeChild(index)}
                      className="absolute -top-3 -right-2 text-danger"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>

                    {/* Child picker — full width */}
                    <Select
                      label={t("children.nameLabel")}
                      aria-label={t("children.nameLabel")}
                      placeholder={t("children.placeholder")}
                      selectedKeys={new Set([entry.child_id])}
                      onSelectionChange={(keys) =>
                        updateChildId(index, [...keys][0] as string)
                      }
                    >
                      {available.map((c) => (
                        <SelectItem
                          key={c.id}
                          textValue={`${c.first_name} ${c.last_name}`}
                        >
                          {c.first_name} {c.last_name}
                        </SelectItem>
                      ))}
                    </Select>

                    {/* Relationship selector — inline radios */}
                    <RadioGroup
                      label={t("children.relationship.label")}
                      aria-label={t("children.relationship.label")}
                      orientation="horizontal"
                      value={entry.relationship}
                      onValueChange={(value) =>
                        updateChildRelationship(
                          index,
                          value as Database["public"]["Enums"]["guardian_relationship"]
                        )
                      }
                    >
                      {RELATIONSHIPS.map((r) => (
                        <Radio key={r} value={r}>
                          {t(`children.relationship.${r}`)}
                        </Radio>
                      ))}
                    </RadioGroup>
                  </div>
                );
              })}

            {/* Add child button — only when there are still unselected children */}
            {selectedChildren.length < children.length && (
              <Button
                variant="flat"
                size="sm"
                onPress={addChildRow}
                className="self-start"
              >
                + {t("children.addChild")}
              </Button>
            )}
          </div>
          {errors.children && (
            <p className="text-small text-danger">{t("children.validationError")}</p>
          )}
        </div>
      </div>
    );
  }
);

ParentForm.displayName = "ParentForm";

export { ParentForm };
