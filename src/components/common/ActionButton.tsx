"use client";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Button } from "@heroui/react";
import { useRouter } from "next/navigation";

export function ActionButton() {
  // TODO:
  // * add role validation
  // * add each role actions
  // * define component props

  const router = useRouter();
  const handleClick = () => {
    router.push("/messages");
  };
  return (
    <div className="fixed bottom-8 right-8">
      <Button
        isIconOnly
        aria-label="actions"
        size="lg"
        color="primary"
        onPress={handleClick}
      >
        <PlusIcon className="w-6 h-6" />
      </Button>
    </div>
  );
}
