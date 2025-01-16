import { Button, Link } from "@nextui-org/react";
import Image from "next/image";

export default async function Home() {
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
        <div className="pt-8">
          <Button
            as={Link}
            href="/login"
            color="primary"
            variant="solid"
            fullWidth
          >
            Iniciar sesión
          </Button>
        </div>
      </section>
    </main>
  );
}
