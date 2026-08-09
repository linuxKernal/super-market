import { LoaderIcon } from "lucide-react";

export default function Spinner() {
    return (
        <div className="flex items-center">
            <LoaderIcon
                role="status"
                aria-label="Loading"
                className="size-4 animate-spin"
            />
        </div>
    );
}
