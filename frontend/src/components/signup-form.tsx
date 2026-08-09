import { useNavigate } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/config";
import { Link } from "react-router";
import { useForm, Controller } from "react-hook-form";
import PasswordInput from "./PasswordInput";
import { Loader2 } from "lucide-react";

async function oauthRedirect(provider: "google" | "github") {
    const res = await fetch(`${API_URL}/auth/${provider}?type=signup`);
    const data = await res.json();

    window.location.href = data.url;
}

const UserRegistrationSchema = z
    .object({
        fullName: z
            .string()
            .min(2, {
                message: "Full name must be at least 2 characters long.",
            })
            .max(100, { message: "Full name cannot exceed 100 characters." })
            .trim(),

        email: z
            .string()
            .min(1, { message: "Email is required." })
            .refine((val) => z.string().email().safeParse(val).success, {
                message: "Invalid email address format.",
            })
            .toLowerCase()
            .trim(),
        password: z
            .string({ message: "Password is required." })
            .min(8, { message: "Password must be at least 8 characters long." })
            .max(50, { message: "Password cannot exceed 50 characters." })
            .regex(/[A-Z]/, {
                message: "Password must contain at least one uppercase letter.",
            })
            .regex(/[a-z]/, {
                message: "Password must contain at least one lowercase letter.",
            })
            .regex(/[0-9]/, {
                message: "Password must contain at least one number.",
            })
            .regex(/[^A-Za-z0-9]/, {
                message:
                    "Password must contain at least one special character.",
            }),

        confirmPassword: z.string({ message: "Confirm Password is required." }),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    });

export function SignupForm() {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(UserRegistrationSchema),
    });

    const navigate = useNavigate();

    async function onSubmit(data: z.infer<typeof UserRegistrationSchema>) {
        const res = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fullname: data.fullName,
                email: data.email,
                password: data.password,
            }),
        });

        const resData = await res.json();

        if (resData.status === "success") {
            navigate("/login");
        } else alert(resData.error);
    }
    return (
        <form
            className="md:gap-x-[5%] w-full"
            onSubmit={handleSubmit(onSubmit)}
        >
            <div className="w-full md:mb-4 mb-2">
                <FieldGroup className="w-full grid md:grid-cols-2 gap-y-3 md:gap-y-4">
                    <Field>
                        <FieldLabel htmlFor="name">Full Name</FieldLabel>
                        <Input
                            id="name"
                            type="text"
                            {...register("fullName")}
                            className="!outline-none !ring-0 !focus:ring-0 !focus:outline-none w-full"
                            placeholder="John Doe"
                        />
                        <p className="text-sm text-red-500">
                            {errors.fullName?.message}
                        </p>
                    </Field>

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <PasswordInput
                                onChange={onChange}
                                value={value}
                                error={errors.password?.message ?? ""}
                                label="Password"
                            />
                        )}
                    />
                </FieldGroup>
            </div>
            <div>
                <FieldGroup className="grid md:grid-cols-2 gap-y-3 md:gap-y-4">
                    <Field>
                        <FieldLabel htmlFor="email">Email</FieldLabel>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            placeholder="m@example.com"
                            className="!outline-none !ring-0 !focus:ring-0 !focus:outline-none"
                        />
                        <p className="text-sm text-red-500">
                            {errors.email?.message}
                        </p>
                    </Field>
                    <Controller
                        control={control}
                        name="confirmPassword"
                        render={({ field: { onChange, value } }) => (
                            <PasswordInput
                                error={errors.confirmPassword?.message ?? ""}
                                label="Confirm Password"
                                onChange={onChange}
                                value={value}
                            />
                        )}
                    />
                </FieldGroup>
            </div>
            <FieldGroup className="col-span-2 mt-5">
                <Field className="w-fit">
                    <Button type="submit" disabled={isSubmitting} className="bg-green-500 text-white">
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Please wait
                            </>
                        ) : (
                            "Create Account"
                        )}
                    </Button>
                </Field>
                <FieldSeparator>Or continue with</FieldSeparator>
                <Field className="w-fit mx-auto">
                    <div className="flex gap-3 sm:gap-6 flex-wrap sm:flex-nowrap mb-3 md:mb-0">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => oauthRedirect("github")}
                            className="border-neutral-300 w-full shrink"
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                                    fill="currentColor"
                                />
                            </svg>
                            Sign up with GitHub
                        </Button>
                        <Button
                            variant="outline"
                            type="button"
                            className="border-neutral-300 w-full shrink"
                            onClick={() => oauthRedirect("google")}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                                    fill="currentColor"
                                />
                            </svg>
                            Sign up with Google
                        </Button>
                    </div>

                    <FieldDescription className="px-6 text-center">
                        Already have an account?{" "}
                        <Link to="/login">Sign in</Link>
                    </FieldDescription>
                </Field>
            </FieldGroup>
        </form>
    );
}
