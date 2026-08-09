import { Upload } from "lucide-react";

type Props = {
    preview: string | undefined;
    handleInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export default function InputImage({ preview, handleInput }: Props) {
    return (
        <div>
            <div className="border border-sky-500 text-sky-500 p-2 w-full rounded-sm">
                <label
                    className="flex gap-2 justify-center"
                    htmlFor="category_image"
                >
                    <Upload />
                    Upload Image
                </label>
                <input
                    type="file"
                    onChange={handleInput}
                    id="category_image"
                    className="hidden  outline-none ring-0 focus:outline-none"
                />
            </div>
            {preview && (
                <div className="relative size-16">
                    {/* <button className="absolute top-0 -right-2 font-bold text-white border bg-red-500 border-red-500 rounded-full">
                        <X className="size-4" />
                    </button> */}
                    <img
                        src={preview}
                        className="object-contain w-full h-full mt-2"
                    />
                </div>
            )}
        </div>
    );
}
