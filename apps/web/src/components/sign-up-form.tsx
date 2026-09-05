import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignUpForm({ onSwitchToSignIn }: { onSwitchToSignIn: () => void }) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: async () => {
            await authClient.getSession();
            toast.success("Enterprise account created successfully!");
            navigate({ to: "/workspace/builder" });
          },
          onError: (error) => {
            toast.error(error?.error?.message || "Account creation failed. Please try again.");
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Create your workspace</h2>
        <p className="text-xs text-muted-foreground">
          Set up your organization account in minutes
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-4 pt-2"
      >
        <div>
          <form.Field name="name">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name} className="text-xs font-medium text-foreground">
                  Full Name
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  placeholder="Alice Johnson"
                  className="bg-background border-input text-xs h-9"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-xs text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="email">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name} className="text-xs font-medium text-foreground">
                  Work Email
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="alice@acmetech.io"
                  className="bg-background border-input text-xs h-9"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-xs text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <div>
          <form.Field name="password">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name} className="text-xs font-medium text-foreground">
                  Password
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  placeholder="••••••••"
                  className="bg-background border-input text-xs h-9"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <p key={error?.message} className="text-xs text-destructive">
                    {error?.message}
                  </p>
                ))}
              </div>
            )}
          </form.Field>
        </div>

        <form.Subscribe>
          {(state) => (
            <Button
              type="submit"
              className="w-full font-medium text-xs h-9"
              disabled={!state.canSubmit || state.isSubmitting}
            >
              {state.isSubmitting ? "Creating Account..." : "Create Enterprise Workspace"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="pt-2 text-center border-t border-border">
        <button
          type="button"
          onClick={onSwitchToSignIn}
          className="text-xs text-primary hover:underline font-medium cursor-pointer"
        >
          Already have an account? Sign In
        </button>
      </div>
    </div>
  );
}
