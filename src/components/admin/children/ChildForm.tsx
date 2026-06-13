"use client";
import { Database } from "@/types/database.types";
import { GuardianEntry } from "@/queries/children/create-child";
import { getAllGroups } from "@/queries/users/get-all-groups";
import { getAvailableParents, ParentOption } from "@/queries/children/get-available-parents";
import { createClient } from "@/utils/supabase/client";
import { Button, Input, Select, SelectItem } from "@heroui/react";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

export type ChildFormValues = {
  first_name: string;
  last_name: string;
  document_type: Database["public"]["Enums"]["document_type"];
  document_number: string;
  gender: Database["public"]["Enums"]["gender_type"];
  birth_date: string;
  address: string;
  groupIds: string[];
  guardians: GuardianEntry[];
};

type GroupOption = { id: string; name: string };

export type LinkedParent = {
  id: string;
  first_name: string;
  last_name: string;
  relationship: Database["public"]["Enums"]["guardian_relationship"];
};

export type ChildFormRef = {
  submit: () => boolean;
  getValues: () => ChildFormValues;
};

type ChildFormProps = {
  defaultValues?: Partial<ChildFormValues>;
  onSubmit: (values: ChildFormValues) => void;
  /** Edit mode: pass already-linked guardians. Read-only display, no picker. */
  linkedParents?: LinkedParent[];
};

const DOC_TYPES: Database["public"]["Enums"]["document_type"][] = [
  "rc", "ti", "passport", "international_id",
];

const GENDERS: Database["public"]["Enums"]["gender_type"][] = ["male", "female"];

const RELATIONSHIPS: Database["public"]["Enums"]["guardian_relationship"][] = [
  "mother", "father", "other",
];

const ChildForm = forwardRef<ChildFormRef, ChildFormProps>(
  ({ defaultValues, onSubmit, linkedParents }, ref) => {
    const t = useTranslations("AdminChildren.form");
    const [groups, setGroups] = useState<GroupOption[]>([]);
    // Only loaded in create mode (linkedParents absent)
    const [parents, setParents] = useState<ParentOption[]>([]);

    const [firstName, setFirstName] = useState(defaultValues?.first_name ?? "");
    const [lastName, setLastName] = useState(defaultValues?.last_name ?? "");
    const [docType, setDocType] = useState<Database["public"]["Enums"]["document_type"]>(
      defaultValues?.document_type ?? "rc"
    );
    const [docNumber, setDocNumber] = useState(defaultValues?.document_number ?? "");
    const [gender, setGender] = useState<Database["public"]["Enums"]["gender_type"]>(
      defaultValues?.gender ?? "male"
    );
    const [birthDate, setBirthDate] = useState(defaultValues?.birth_date ?? "");
    const [address, setAddress] = useState(defaultValues?.address ?? "");
    const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>(
      defaultValues?.groupIds ?? []
    );
    const [selectedGuardians, setSelectedGuardians] = useState<GuardianEntry[]>(
      defaultValues?.guardians ?? []
    );

    const [errors, setErrors] = useState<Partial<Record<keyof ChildFormValues, string>>>({});

    useEffect(() => {
      const client = createClient();
      getAllGroups(client).then(({ data }) => {
        if (data) setGroups(data.map((g) => ({ id: g.id, name: g.name })));
      });
      // In edit mode linkedParents is provided — skip loading all parents
      if (linkedParents === undefined) {
        getAvailableParents(client).then((data) => setParents(data));
      }
    }, [linkedParents]);

    useImperativeHandle(ref, () => ({
      submit: () => {
        const newErrors: typeof errors = {};
        if (!firstName.trim()) newErrors.first_name = "required";
        if (!lastName.trim()) newErrors.last_name = "required";
        if (!docNumber.trim()) newErrors.document_number = "required";
        if (!birthDate) newErrors.birth_date = "required";
        if (!address.trim()) newErrors.address = "required";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return false;
        onSubmit({
          first_name: firstName,
          last_name: lastName,
          document_type: docType,
          document_number: docNumber,
          gender,
          birth_date: birthDate,
          address,
          groupIds: selectedGroupIds,
          guardians: selectedGuardians,
        });
        return true;
      },
      getValues: () => ({
        first_name: firstName,
        last_name: lastName,
        document_type: docType,
        document_number: docNumber,
        gender,
        birth_date: birthDate,
        address,
        groupIds: selectedGroupIds,
        guardians: selectedGuardians,
      }),
    }));

    // Helpers for the guardian list in create mode
    const addGuardianRow = () => {
      // Pick the first parent not already selected, default relationship "other"
      const usedIds = new Set(selectedGuardians.map((g) => g.guardian_id));
      const next = parents.find((p) => !usedIds.has(p.id));
      if (!next) return;
      setSelectedGuardians((prev) => [
        ...prev,
        { guardian_id: next.id, relationship: "other" },
      ]);
    };

    const updateGuardianId = (index: number, guardian_id: string) => {
      setSelectedGuardians((prev) =>
        prev.map((g, i) => (i === index ? { ...g, guardian_id } : g))
      );
    };

    const updateGuardianRelationship = (
      index: number,
      relationship: Database["public"]["Enums"]["guardian_relationship"]
    ) => {
      setSelectedGuardians((prev) =>
        prev.map((g, i) => (i === index ? { ...g, relationship } : g))
      );
    };

    const removeGuardian = (index: number) => {
      setSelectedGuardians((prev) => prev.filter((_, i) => i !== index));
    };

    // Parents already used in other rows (to avoid duplicates)
    const usedGuardianIds = (excludeIndex: number) =>
      new Set(selectedGuardians.filter((_, i) => i !== excludeIndex).map((g) => g.guardian_id));

    return (
      <div className="flex flex-col gap-4">
        {/* ID */}
        <div className="flex gap-2">
          <Select
            label={t("idType.label")}
            placeholder={t("idType.placeholder")}
            selectedKeys={[docType]}
            onSelectionChange={(keys) => setDocType([...keys][0] as Database["public"]["Enums"]["document_type"])}
            className="w-36 shrink-0"
          >
            {DOC_TYPES.map((dt) => (
              <SelectItem key={dt} textValue={t(`idType.${dt}`)}>{t(`idType.${dt}`)}</SelectItem>
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

        {/* Gender */}
        <Select
          label={t("gender.label")}
          placeholder={t("gender.placeholder")}
          selectedKeys={[gender]}
          onSelectionChange={(keys) => setGender([...keys][0] as Database["public"]["Enums"]["gender_type"])}
        >
          {GENDERS.map((g) => (
            <SelectItem key={g} textValue={t(`gender.${g}`)}>{t(`gender.${g}`)}</SelectItem>
          ))}
        </Select>

        {/* Birth date */}
        <Input
          type="date"
          label={t("birthDay.label")}
          placeholder={t("birthDay.placeholder")}
          value={birthDate}
          onValueChange={setBirthDate}
          isInvalid={!!errors.birth_date}
        />

        {/* Address */}
        <Input
          label={t("address.label")}
          placeholder={t("address.placeholder")}
          value={address}
          onValueChange={setAddress}
          isInvalid={!!errors.address}
        />

        {/* Groups (optional) */}
        {groups.length > 0 && (
          <Select
            label={t("groups.label")}
            placeholder={t("groups.placeholder")}
            selectionMode="multiple"
            selectedKeys={new Set(selectedGroupIds)}
            onSelectionChange={(keys) => setSelectedGroupIds([...keys] as string[])}
          >
            {groups.map((g) => (
              <SelectItem key={g.id} textValue={g.name}>{g.name}</SelectItem>
            ))}
          </Select>
        )}

        {/* Parents / guardians */}
        <div className="flex flex-col gap-2">
          <span className="text-small font-medium text-foreground">{t("parents.label")}</span>

          {linkedParents !== undefined ? (
            // Edit mode: show already-linked guardians (read-only)
            linkedParents.length === 0 ? (
              <p className="text-small text-default-500 py-1">{t("parents.noParents")}</p>
            ) : (
              <div className="flex flex-col gap-1">
                {linkedParents.map((p) => (
                  <span
                    key={p.id}
                    className="text-small text-foreground py-1 border-b border-divider last:border-0"
                  >
                    {p.first_name} {p.last_name}
                    <span className="text-default-400 ml-1">
                      ({t(`parents.relationship.${p.relationship}`)})
                    </span>
                  </span>
                ))}
              </div>
            )
          ) : (
            // Create mode: list of (parent picker + relationship selector) rows
            <div className="flex flex-col gap-5 w-[96%]">
              {selectedGuardians.map((entry, index) => {
                const excluded = usedGuardianIds(index);
                const available = parents.filter((p) => !excluded.has(p.id));

                return (
                  <div key={index} className="relative flex flex-col gap-1 pt-4 px-2 pb-2 rounded-lg border border-divider">
                    {/* Remove button — top-right corner */}
                    <button
                      type="button"
                      aria-label={t("parents.remove")}
                      onClick={() => removeGuardian(index)}
                      className="absolute -top-3 -right-2 text-danger"
                    >
                      <XCircleIcon className="w-6 h-6" />
                    </button>

                    {/* Parent picker — full width */}
                    <Select
                      label={t("parents.nameLabel")}
                      aria-label={t("parents.nameLabel")}
                      placeholder={t("parents.placeholder")}
                      selectedKeys={new Set([entry.guardian_id])}
                      onSelectionChange={(keys) =>
                        updateGuardianId(index, [...keys][0] as string)
                      }
                    >
                      {available.map((p) => (
                        <SelectItem
                          key={p.id}
                          textValue={`${p.first_name} ${p.last_name}`}
                        >
                          {p.first_name} {p.last_name}
                        </SelectItem>
                      ))}
                    </Select>

                    {/* Relationship selector — full width */}
                    <Select
                      label={t("parents.relationship.label")}
                      aria-label={t("parents.relationship.label")}
                      placeholder={t("parents.relationship.placeholder")}
                      selectedKeys={new Set([entry.relationship])}
                      onSelectionChange={(keys) =>
                        updateGuardianRelationship(
                          index,
                          [...keys][0] as Database["public"]["Enums"]["guardian_relationship"]
                        )
                      }
                    >
                      {RELATIONSHIPS.map((r) => (
                        <SelectItem key={r} textValue={t(`parents.relationship.${r}`)}>
                          {t(`parents.relationship.${r}`)}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                );
              })}

              {/* Add parent button — only when there are still unselected parents */}
              {selectedGuardians.length < parents.length && (
                <Button
                  variant="flat"
                  size="sm"
                  onPress={addGuardianRow}
                  className="self-start"
                >
                  + {t("parents.addParent")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }
);

ChildForm.displayName = "ChildForm";

export { ChildForm };
