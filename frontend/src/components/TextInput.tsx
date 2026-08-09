import { NotebookText } from "lucide-react";

type Props = {
    placeholder: string;
    handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    id: string;
    defaultValue: string;
};

export default function TextInput({
    placeholder,
    handleInput,
    id,
    defaultValue,
}: Props) {
    return (
        <div className="grid gap-y-1">
            <label htmlFor={id} className="">
                Name
            </label>
            <div className="border border-neutral-300 p-2 w-full rounded-sm flex gap-2">
                <NotebookText />
                <input
                    type="text"
                    onChange={handleInput}
                    defaultValue={defaultValue}
                    placeholder={placeholder}
                    id={id}
                    className="outline-none ring-0 focus:outline-none w-full"
                />
            </div>
        </div>
    );
}
