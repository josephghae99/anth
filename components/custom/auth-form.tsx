import { useRef } from "react";

import { Input } from "../ui/input";
import { Label } from "../ui/label";

interface AuthFormProps {
  action: (formData: FormData) => Promise<void>;
  children: React.ReactNode;
  defaultEmail?: string;
}

export function AuthForm({ action, children, defaultEmail }: AuthFormProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    await action(formData);
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4 px-4 sm:px-16">
      <div>
        <Label htmlFor="email">Email address</Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="name@example.com"
          required
          defaultValue={defaultEmail}
        />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          placeholder="••••••••"
          required
          minLength={6}
        />
      </div>
      {children}
    </form>
  );
}
