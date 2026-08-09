import { useNavigate, useSearchParams, Link } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FieldGroup } from "@/components/ui/field";
import PasswordInput from "@/components/PasswordInput";
import { API_URL } from "@/config";

const ResetPasswordSchema = z.object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"]
});

export default function ResetPasswordPage() {
    const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(ResetPasswordSchema),
        defaultValues: { newPassword: "", confirmPassword: "" }
    });

    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    async function onSubmit(data: z.infer<typeof ResetPasswordSchema>) {
        if (!token) {
            toast.error("Missing reset token. Please request a new link.");
            return;
        }

        try {
            const res = await fetch(`${API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: data.newPassword }),
            });
            const resData = await res.json();

            if (resData.status === "success") {
                toast.success("Password reset successfully! Please log in.");
                navigate("/login");
            } else {
                toast.error(resData.detail || resData.error || "Failed to reset password. The link might be expired.");
            }
        } catch (error) {
            toast.error("Network error. Please try again later.");
        }
    }

    if (!token) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-50 h-full">
                <Card className="w-full max-w-sm text-center">
                    <CardHeader>
                        <CardTitle className="text-xl text-red-600">Invalid Link</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-neutral-600">The password reset link is invalid or missing.</p>
                        <Button asChild className="w-full">
                            <Link to="/forgot-password">Request New Link</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-50 h-full">
            <div className="w-full max-w-sm">
                <Card className="border-neutral-100 shadow-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Create New Password</CardTitle>
                        <CardDescription>
                            Please enter your new password below.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <FieldGroup>
                                <div className="space-y-4">
                                    <Controller
                                        control={control}
                                        name="newPassword"
                                        render={({ field: { onChange, value } }) => (
                                            <PasswordInput
                                                onChange={onChange}
                                                value={value}
                                                error={errors.newPassword?.message ?? ""}
                                                label="New Password"
                                            />
                                        )}
                                    />
                                    <Controller
                                        control={control}
                                        name="confirmPassword"
                                        render={({ field: { onChange, value } }) => (
                                            <PasswordInput
                                                onChange={onChange}
                                                value={value}
                                                error={errors.confirmPassword?.message ?? ""}
                                                label="Confirm New Password"
                                            />
                                        )}
                                    />
                                    <Button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white mt-4"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="animate-spin size-4" /> Saving Protocol...
                                            </span>
                                        ) : (
                                            "Update Password"
                                        )}
                                    </Button>
                                </div>
                            </FieldGroup>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
