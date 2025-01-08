import { Image } from "@nextui-org/react";
import LoginForm from "./components/auth/LoginForm";

export default async function Home() {
  return (
    <main className="flex h-screen flex-1 items-center justify-center p-4">
      <section className="flex flex-col w-full md:w-80 gap-8 items-center justify-center">
        <Image
          src="/brand/logo-encanto-vertical.svg"
          alt="Encato logo vertical"
        />
        <LoginForm />
      </section>
    </main>
  );
}
