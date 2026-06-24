"use client";
import { getAvailableTeachers, TeacherOption } from "@/queries/groups/get-available-teachers";
import { createClient } from "@/utils/supabase/client";
import { Input, Select, SelectItem } from "@heroui/react";
import { PhotoIcon, CameraIcon } from "@heroicons/react/24/solid";
import { useTranslations } from "next-intl";
import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

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

    const [imageFile, setImageFile] = useState<File | null | undefined>(
      defaultValues?.imageFile
    );
    const [imagePreview, setImagePreview] = useState<string | null>(
      defaultValues?.existingImageUrl ?? null
    );
    const imageInputRef = useRef<HTMLInputElement>(null);

    const [errors, setErrors] = useState<Partial<Record<keyof GroupFormValues, string>>>({});

    useEffect(() => {
      const client = createClient();
      getAvailableTeachers(client).then((data) => {
        setTeachers(data);
        // Drop previously-assigned teacher ids that no longer exist, so they
        // don't get passed to Select's selectedKeys as orphaned keys.
        setTeacherIds((prev) => prev.filter((id) => data.some((tch) => tch.id === id)));
      });
    }, []);

    useEffect(() => {
      return () => {
        if (imagePreview && imagePreview.startsWith("blob:")) {
          URL.revokeObjectURL(imagePreview);
        }
      };
    }, [imagePreview]);

    const handleImagePick = () => imageInputRef.current?.click();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);

      const preview = URL.createObjectURL(file);
      setImageFile(file);
      setImagePreview(preview);
      e.target.value = "";
    };

    const handleImageRemove = () => {
      if (imagePreview?.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
      setImageFile(null); // null = explicit removal
      setImagePreview(null);
    };

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

    const hasImage = imagePreview !== null;

    return (
      <div className="flex flex-col gap-4 w-full min-w-0">
        {/* Image picker */}
        <div className="flex flex-col items-center gap-2 py-2">
          <button
            type="button"
            aria-label={hasImage ? t("image.change") : t("image.add")}
            onClick={handleImagePick}
            className="relative w-24 h-24 active:opacity-70 focus-visible:outline-none"
          >
            <span className="w-full h-full rounded-full overflow-hidden bg-default-100 flex items-center justify-center ring-2 ring-offset-2 ring-default-200 focus-visible:ring-primary">
              {hasImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imagePreview}
                  alt={t("image.label")}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PhotoIcon className="w-12 h-12 text-default-300" />
              )}
            </span>
            <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
              <CameraIcon className="w-3.5 h-3.5 text-white" />
            </span>
          </button>

          {hasImage && (
            <button
              type="button"
              onClick={handleImageRemove}
              className="text-xs text-danger hover:underline"
            >
              {t("image.remove")}
            </button>
          )}

          <input
            ref={imageInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleImageChange}
          />
        </div>

        {/* Name */}
        <Input
          label={t("name.label")}
          placeholder={t("name.placeholder")}
          value={name}
          onValueChange={setName}
          isInvalid={!!errors.name}
        />

        {/* Teachers (optional, multiple) */}
        <Select
          label={t("teachers.label")}
          placeholder={t("teachers.placeholder")}
          selectionMode="multiple"
          selectedKeys={teacherIds.filter((id) => teachers.some((tch) => tch.id === id))}
          onSelectionChange={(keys) => setTeacherIds([...keys] as string[])}
          className="w-full min-w-0"
          classNames={{ trigger: "min-w-0", innerWrapper: "min-w-0", value: "truncate" }}
        >
          {teachers.map((teacher) => (
            <SelectItem
              key={teacher.id}
              textValue={`${teacher.first_name} ${teacher.last_name}`}
            >
              {teacher.first_name} {teacher.last_name}
            </SelectItem>
          ))}
        </Select>
      </div>
    );
  }
);

GroupForm.displayName = "GroupForm";

export { GroupForm };
