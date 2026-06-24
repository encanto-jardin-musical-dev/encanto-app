"use client";
import { getAvailableTeachers, TeacherOption } from "@/queries/groups/get-available-teachers";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@heroui/react";
import { PhotoIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { useImagePicker } from "@/hooks/UseImagePicker";
import { ImagePicker } from "@/components/common/ImagePicker";
import { EntityMultiSelect } from "@/components/common/EntityMultiSelect";

export type GroupFormValues = {
  name: string;
  teacherIds: string[];
  /**
   * Image state:
   * - `undefined`  → no change (keep existing image_url)
   * - `File`       → new image to upload
   * - `null`       → remove existing image
   */
  imageFile: File | null | undefined;
};

export type GroupFormRef = {
  submit: () => boolean;
  getValues: () => GroupFormValues;
};

type GroupFormProps = {
  defaultValues?: Partial<GroupFormValues> & { existingImageUrl?: string | null };
  onSubmit: (values: GroupFormValues) => void;
};

const GroupForm = forwardRef<GroupFormRef, GroupFormProps>(
  ({ defaultValues, onSubmit }, ref) => {
    const t = useTranslations("AdminGroups.form");
    const [teachers, setTeachers] = useState<TeacherOption[]>([]);

    const [name, setName] = useState(defaultValues?.name ?? "");
    const [teacherIds, setTeacherIds] = useState<string[]>(defaultValues?.teacherIds ?? []);

    // Image: managed by useImagePicker
    const { file: imageFile, preview: imagePreview, pick: pickImage, remove: removeImage, inputProps: imageInputProps } =
      useImagePicker(defaultValues?.existingImageUrl ?? null);

    const [errors, setErrors] = useState<Partial<Record<keyof GroupFormValues, string>>>({});

    useEffect(() => {
      const client = createClient();
      getAvailableTeachers(client).then((data) => setTeachers(data));
    }, []);

    useImperativeHandle(ref, () => ({
      submit: () => {
        const newErrors: typeof errors = {};
        if (!name.trim()) newErrors.name = "required";
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return false;
        onSubmit({ name, teacherIds, imageFile });
        return true;
      },
      getValues: () => ({ name, teacherIds, imageFile }),
    }));

    return (
      <div className="flex flex-col gap-4 w-full min-w-0">
        {/* Image picker */}
        <ImagePicker
          preview={imagePreview}
          fallbackIcon={PhotoIcon}
          fallbackIconClassName="w-12 h-12 text-default-300"
          shape="circle"
          labels={{
            add: t("image.add"),
            change: t("image.change"),
            remove: t("image.remove"),
            label: t("image.label"),
          }}
          onPick={pickImage}
          onRemove={removeImage}
          inputProps={imageInputProps}
        />

        {/* Name */}
        <Input
          label={t("name.label")}
          placeholder={t("name.placeholder")}
          value={name}
          onValueChange={setName}
          isInvalid={!!errors.name}
        />

        {/* Teachers (optional, multiple) */}
        <EntityMultiSelect
          items={teachers}
          selectedIds={teacherIds}
          onChange={setTeacherIds}
          getId={(t) => t.id}
          getLabel={(t) => `${t.first_name} ${t.last_name}`}
          label={t("teachers.label")}
          placeholder={t("teachers.placeholder")}
          className="w-full min-w-0"
          classNames={{ trigger: "min-w-0", innerWrapper: "min-w-0", value: "truncate" }}
        />
      </div>
    );
  }
);

GroupForm.displayName = "GroupForm";

export { GroupForm };
