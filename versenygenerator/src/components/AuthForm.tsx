"use client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CardContent } from "./ui/card";
import { CardFooter } from "./ui/card";
import { Button } from "./ui/button";
import { useTransition } from "react";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import Link from "next/link";
import { loginAction, signUpAction } from "@/actions/users";

type Props = {
  type: "login" | "signUp";
};

function AuthForm({ type }: Props) {
  const isLoginForm = type === "login";
  const router = useRouter();

  const [isPending, startTransition] = useTransition();

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      const email = (formData.get("email") as string)?.trim();
      const password = (formData.get("password") as string)?.trim();

      if (!email || !password) {
        toast.error("Kérlek, töltsd ki az összes mezőt!");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast.error("Érvénytelen email formátum!");
        return;
      }

      if (password.length < 6) {
        toast.error("A jelszónak legalább 6 karakter hosszúnak kell lennie!");
        return;
      }

      try {
        let errorMessage;
        if (isLoginForm) {
          errorMessage = (await loginAction(email, password))?.errorMessage ?? null;
        } else {
          errorMessage = (await signUpAction(email, password))?.errorMessage ?? null;
        }

        if (!errorMessage) {
          toast.success(
            isLoginForm
              ? "Sikeres bejelentkezés!"
              : "Sikeres regisztráció! Erősítse meg az email címét!"
          );
          router.replace("/");
        } else {
          toast.error(`Hiba: ${errorMessage}`);
        }
      } catch (error) {
        console.error(error);
        toast.error("Váratlan hiba történt. Próbáld újra később.");
      }
    });
  };

  return (
    <form action={handleSubmit}>
      <CardContent className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="email" className="text-lg">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            placeholder="Email cím megadása"
            type="email"
            required
          />
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="password" className="text-lg">
            Jelszó
          </Label>
          <Input
            id="password"
            name="password"
            placeholder="Jelszó megadása"
            type="password"
            required
          />
        </div>
      </CardContent>

      <CardFooter className="mt-4 flex flex-col gap-6">
        <Button className="w-full text-lg" disabled={isPending}>
          {isPending
            ? isLoginForm
              ? "Bejelentkezés..."
              : "Regisztráció..."
            : isLoginForm
            ? "Bejelentkezés"
            : "Regisztráció"}
        </Button>

        <p className="text-xs">
          {isLoginForm ? "Még nincs fiókod?" : "Már van fiókod?"}{" "}
          <Link
            href={isLoginForm ? "/sign-up" : "/login"}
            className="text-blue-500 underline hover:text-blue-700"
          >
            {isLoginForm ? "Regisztráció" : "Bejelentkezés"}
          </Link>
        </p>
      </CardFooter>
    </form>
  );
}

export default AuthForm;
