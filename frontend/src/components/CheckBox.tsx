type Props = {
    label: string;
    handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
    defaultValue: boolean;
};

export default function CheckBox({ label, handleInput, defaultValue }: Props) {
    return (
        <div className="ml-auto w-fit flex gap-1 items-center">
            <label
                htmlFor="featured_input"
                className="text-neutral-600 select-none"
            >
                {label}
            </label>
            <input
                type="checkbox"
                defaultChecked={defaultValue}
                onChange={handleInput}
                id="featured_input"
            />
        </div>
    );
}
