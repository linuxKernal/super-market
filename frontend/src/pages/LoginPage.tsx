import { useNavigate, Link, useSearchParams, useLocation } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import GithubIcon from "@/assets/github.png";
import { Controller, useForm } from "react-hook-form";
import { API_URL } from "@/config";
import PasswordInput from "@/components/PasswordInput";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/contexts/authContext";
import { Loader2 } from "lucide-react";

const LoginSchema = z.object({
    email: z.email({ message: "Invalid email address format." }),
    password: z.string().min(1, { message: "Password Required" }),
});

export default function LoginForm() {
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm({
        resolver: zodResolver(LoginSchema),
    });

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const { logoutSuccess } = location.state || {};
    const { setUserData } = useAuth();

    useEffect(() => {
        const error = searchParams.get("error");

        if (error) {
            toast.error(error);
        }
    }, [searchParams]);

    useEffect(
        function () {
            if (logoutSuccess) {
                toast.success("logout in successfully.", {
                    toastId: "login-logout-message",
                });
                navigate(location.pathname, { replace: true, state: null });
            }
        },
        [logoutSuccess, navigate, location.pathname]
    );

    async function oauthRedirect(provider: "google" | "github") {
        const res = await fetch(`${API_URL}/auth/${provider}`);
        const data = await res.json();

        window.location.href = data.url;
    }

    async function onSubmit(data: z.infer<typeof LoginSchema>) {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: data.email,
                password: data.password,
            }),
        });

        const resData = await res.json();

        console.log("resData", resData);
        if (resData.status === "success") {
            try {
                const userRes = await fetch(`${API_URL}/users/me`, {
                    credentials: "include",
                });
                const userData = await userRes.json();
                if (userData?.status === "success") {
                    setUserData(userData.data);
                }
            } catch (error) {
                console.error("Failed to fetch user data after login", error);
            }

            navigate(resData.data.redirect, {
                state: {
                    loginSuccess: true,
                },
            });
        } else alert(resData.error);
    }

    return (
        <div className="h-full flex flex-col items-center justify-center gap-6 p-6 md:p-10 bg-neutral-50">
            <div className="flex w-full max-w-sm flex-col gap-6 bg-white">
                <div className="flex flex-col gap-6">
                    <Card className="border-neutral-100">
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl">
                                Welcome back
                            </CardTitle>
                            <CardDescription>
                                Login with your Google or Github account
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <FieldGroup>
                                    <Field className="grid md:grid-cols-2">
                                        <Button
                                            variant="outline"
                                            type="button"
                                            onClick={() =>
                                                oauthRedirect("github")
                                            }
                                            className="border-neutral-200"
                                        >
                                            <img
                                                src={GithubIcon}
                                                className="size-5"
                                                alt=""
                                            />
                                            Login with Github
                                        </Button>
                                        <Button
                                            variant="outline"
                                            type="button"
                                            className="border-neutral-200"
                                            onClick={() =>
                                                oauthRedirect("google")
                                            }
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
                                            Login with Google
                                        </Button>
                                    </Field>
                                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                                        Or continue with
                                    </FieldSeparator>
                                    <div className="space-y-3">
                                        <Field className="">
                                            <FieldLabel htmlFor="email">
                                                Email
                                            </FieldLabel>
                                            <Input
                                                id="email"
                                                type="email"
                                                {...register("email")}
                                                className="!outline-none !ring-0 !focus:ring-0 !focus:outline-none"
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-500">
                                                    {errors.email.message}
                                                </p>
                                            )}
                                        </Field>
                                        <Controller
                                            control={control}
                                            name="password"
                                            render={({
                                                field: { onChange, value },
                                            }) => (
                                                <PasswordInput
                                                    onChange={onChange}
                                                    value={value}
                                                    error={
                                                        errors.password
                                                            ?.message ?? ""
                                                    }
                                                    label="Password"
                                                />
                                            )}
                                        />
                                        <Field className="mt-4">
                                            <Button
                                                type="submit"
                                                className="bg-green-500 hover:bg-green-600 text-white"
                                                disabled={isSubmitting}
                                            >
                                                {isSubmitting ? (
                                                    <span className="flex items-center gap-2">
                                                        <Loader2 className="animate-spin size-4" />{" "}
                                                        Loading...
                                                    </span>
                                                ) : (
                                                    "Login"
                                                )}
                                            </Button>
                                            <div className="flex flex-col gap-2.5 items-center mt-2">
                                                <Link to="/forgot-password" className="text-sm text-emerald-600 font-medium hover:underline">
                                                    Forgot your password?
                                                </Link>
                                                <FieldDescription className="text-center">
                                                    Don&apos;t have an account?{" "}
                                                    <Link to="/register" className="ml-1 text-emerald-600 font-medium hover:underline">
                                                        Signup
                                                    </Link>
                                                </FieldDescription>
                                            </div>
                                        </Field>
                                    </div>
                                </FieldGroup>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
