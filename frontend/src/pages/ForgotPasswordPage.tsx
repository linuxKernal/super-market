import { useState } from "react";
import { Link } from "react-router";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field, FieldLabel, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { API_URL } from "@/config";

const ForgotPasswordSchema = z.object({
    email: z.email({ message: "Invalid email address format." }),
});

export default function ForgotPasswordPage() {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(ForgotPasswordSchema),
    });

    const [isSent, setIsSent] = useState(false);

    async function onSubmit(data: z.infer<typeof ForgotPasswordSchema>) {
        try {
            const res = await fetch(`${API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: data.email }),
            });
            const resData = await res.json();

            if (resData.status === "success") {
                setIsSent(true);
                toast.success(resData.message);
            } else {
                toast.error(resData.error || "Failed to send reset email");
            }
        } catch (error) {
            toast.error("Network error. Please try again later.");
        }
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-neutral-50 h-full">
            <div className="w-full max-w-sm">
                <Card className="border-neutral-100 shadow-sm">
                    <CardHeader className="text-center">
                        <CardTitle className="text-xl">Reset Password</CardTitle>
                        <CardDescription>
                            Enter your email and we'll send you a link to reset your password.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isSent ? (
                            <div className="text-center space-y-4">
                                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-lg text-sm">
                                    Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.
                                </div>
                                <Button asChild variant="outline" className="w-full">
                                    <Link to="/login">Return to Login</Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit(onSubmit)}>
                                <FieldGroup>
                                    <div className="space-y-4">
                                        <Field>
                                            <FieldLabel htmlFor="email">Email Address</FieldLabel>
                                            <Input
                                                id="email"
                                                type="email"
                                                {...register("email")}
                                                className="!outline-none !ring-0 !focus:ring-0"
                                                placeholder="john@example.com"
                                            />
                                            {errors.email && (
                                                <p className="text-sm text-red-500">{errors.email.message}</p>
                                            )}
                                        </Field>
                                        <Button
                                            type="submit"
                                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <span className="flex items-center gap-2">
                                                    <Loader2 className="animate-spin size-4" /> Sending Link...
                                                </span>
                                            ) : (
                                                "Send Reset Link"
                                            )}
                                        </Button>
                                    </div>
                                    <div className="text-center mt-6 text-sm text-neutral-500">
                                        Remember your password? <Link to="/login" className="text-emerald-600 underline">Login</Link>
                                    </div>
                                </FieldGroup>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
