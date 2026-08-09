import { Field, FieldLabel } from "@/components/ui/field";
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from "@/components/ui/input-group";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type Props = {
    label: string;
    error: string;
    value: string;
    onChange: (value: string) => void;
    isForgetPassword?: boolean;
};

export default function PasswordInput({
    error,
    label,
    value,
    onChange,
    isForgetPassword = false,
}: Props) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <Field>
            <div className="flex items-center">
                <FieldLabel htmlFor="password">{label}</FieldLabel>
                {isForgetPassword && (
                    <a
                        href="#"
                        className="ml-auto text-sm underline-offset-4 hover:underline"
                    >
                        Forgot your password?
                    </a>
                )}
            </div>
            <InputGroup>
                <InputGroupInput
                    id="password"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    type={showPassword ? "text" : "password"}
                />
                <InputGroupAddon
                    align="inline-end"
                    className="cursor-default"
                    onClick={() => setShowPassword((prev) => !prev)}
                >
                    {showPassword ? (
                        <Eye className="size-5" />
                    ) : (
                        <EyeOff className="size-5" />
                    )}
                </InputGroupAddon>
            </InputGroup>

            {error && <p className="text-sm text-red-500">{error}</p>}
        </Field>
    );
}
