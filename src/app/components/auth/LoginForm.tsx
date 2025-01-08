"use client";

import { createClient } from "@/utils/supabase/client";
import { Button, Form, Input } from "@nextui-org/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const togglePasswordVisibility = () =>
    setIsPasswordVisible(!isPasswordVisible);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      router.refresh();
      router.push("/dashboard");
    }
  };

  return (
    <Form
      className="w-full"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Input
        label="Email"
        type="email"
        name="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        label="Password"
        type={isPasswordVisible ? "text" : "password"}
        name="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        endContent={
          <button
            aria-label="toggle password visibility"
            className="focus:outline-none"
            type="button"
            onClick={togglePasswordVisibility}
          >
            {isPasswordVisible ? (
              <EyeSlashIcon className="w-6 h-6 text-gray-500" />
            ) : (
              <EyeIcon className="w-6 h-6 text-gray-500" />
            )}
          </button>
        }
      />
      <div className="pt-9 w-full">
        <Button color="primary" fullWidth type="submit">
          Login
        </Button>
      </div>
    </Form>
  );
}
