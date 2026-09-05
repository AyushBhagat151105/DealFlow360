import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { z } from "zod";

import { authClient } from "@/lib/auth-client";
import { useAuthStore, USER_ROLES, type UserRole } from "@/stores/auth-store";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
  const navigate = useNavigate();

  const form = useForm({
    defaultValues: {
      email: "rep@dealflow360.com",
      password: "Password123!",
    },
    onSubmit: async ({ value }) => {
      await authClient.signIn.email(
        {
          email: value.email,
          password: value.password,
        },
        {
          onSuccess: async (ctx) => {
            const session = await authClient.getSession();
            const currentUser = ctx?.data?.user ?? session.data?.user;

            let activeRole: UserRole = "rep";
            for (const roleKey of Object.keys(USER_ROLES) as UserRole[]) {
              if (value.email.toLowerCase().includes(roleKey)) {
                activeRole = roleKey;
                break;
              }
            }

            try {
              const orgList = await authClient.organization.list();
              const defaultOrg = orgList.data?.[0];
              if (defaultOrg) {
                await authClient.organization.setActive({
                  organizationId: defaultOrg.id,
                });
                const memberRes = await authClient.organization.getActiveMember();
                const role = memberRes.data?.role;
                if (role && role in USER_ROLES) {
                  activeRole = role as UserRole;
                }
              }
            } catch {
              // Ignore organization fetch error
            }

            if (currentUser) {
              useAuthStore.getState().login(activeRole, {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: activeRole,
              });
            } else {
              useAuthStore.getState().login(activeRole);
            }

            toast.success("Signed in successfully");
            navigate({ to: "/workspace/builder" });
          },
          onError: (error) => {
            toast.error(error?.error?.message || "Sign in failed. Please check your credentials.");
          },
        }
      );
    },
    validators: {
      onSubmit: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
      }),
    },
  });

  return (
    <div className="w-full space-y-4">
      <div className="space-y-1 text-center">
        <h2 className="text-xl font-bold tracking-tight text-foreground">Welcome back</h2>
        <p className="text-xs text-muted-foreground">
          Sign in to your enterprise workspace
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
          <form.Field name="email">
            {(field) => (
              <div className="space-y-1.5">
                <Label htmlFor={field.name} className="text-xs font-medium text-foreground">
                  Email Address
                </Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  placeholder="rep@dealflow360.com"
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
              {state.isSubmitting ? "Authenticating..." : "Sign In to Workspace"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <div className="pt-2 text-center border-t border-border">
        <button
          type="button"
          onClick={onSwitchToSignUp}
          className="text-xs text-primary hover:underline font-medium cursor-pointer"
        >
          Need an account? Create Enterprise Account
        </button>
      </div>
    </div>
  );
}
