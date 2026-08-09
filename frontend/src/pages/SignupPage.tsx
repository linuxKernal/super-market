import { SignupForm } from "@/components/signup-form";

export default function SignupPage() {
    return (
        <div className="flex justify-center items-center h-full">
            <div className="flex flex-col gap-y-8 items-center md:border md:border-neutral-200 justify-center rounded-md px-2 sm:px-6 md:px-8 pb-8 pt-4 md:shadow-sm w-[calc(100%-10px)] md:w-2xl">
                <div className="grid items-center gap-1 text-center w-fit mx-auto">
                    <h1 className="text-2xl font-bold">Create your account</h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Fill in the form below to create your account
                    </p>
                </div>
                <SignupForm />
            </div>
        </div>
    );
}
