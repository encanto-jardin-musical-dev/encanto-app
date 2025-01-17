import { Button, Link } from "@nextui-org/react";
import { useTranslations } from "next-intl";
import Image from "next/image";

export default function Home() {
  const t = useTranslations("HomePage");
  return (
    <main
      className="flex flex-col items-center justify-center p-4 h-screen"
      id="Home"
    >
      <section>
        <div className="flex flex-1 items-center justify-center">
          <Image
            src="/brand/logo-encanto-vertical.svg"
            alt="Encato logo vertical"
            width={200}
            height={200}
            unoptimized
          />
        </div>
        <div className="py-4 text-center">
          <h2>{t("welcome")}</h2>
          <p>{t("description")}</p>
        </div>
        <div className="pt-8">
          <Button
            as={Link}
            href="/login"
            color="primary"
            variant="solid"
            fullWidth
          >
            {t("button")}
          </Button>
        </div>
      </section>
    </main>
  );
}
