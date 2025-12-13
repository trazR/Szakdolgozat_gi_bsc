"use client";

import { Button } from "./ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { logOutAction } from "@/actions/users";

function LogOutButton(){
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogOut = async () =>{
    setLoading(true);

    const result = await logOutAction();
    const errorMessage = result?.errorMessage;

    if (!errorMessage) {
      router.replace("/");
      toast.success("Sikeres kijelentkezés!");
    } else {
      toast.error(`Hiba: ${errorMessage}`);
    }

    setLoading(false);
  };

  return (
    <Button
      onClick={handleLogOut}
      disabled={loading}
      className="w-24"
    >
      Kijelentkezés
    </Button>
  );
}

export default LogOutButton;
