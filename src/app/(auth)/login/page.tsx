import NextImage from "next/image";
import LoginForm from "@/components/auth/LoginForm";

export default async function LoginPage() {
  return (
    <main className="flex h-screen flex-1 items-center justify-center p-4">
      <section className="flex flex-col h-full  w-full md:w-80 gap-12 items-center justify-center">
        <div className="flex flex-1 items-center justify-center">
          <NextImage
            src="/brand/logo-encanto-vertical.svg"
            alt="Encato logo vertical"
            width={200}
            height={200}
            unoptimized
          />
        </div>
        <div className="flex-1 w-full justify-center items-center pt-8">
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
