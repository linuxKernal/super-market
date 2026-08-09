import { X } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
    children: ReactNode;
    handleCloseModal?: () => void;
};

export default function CategoryModal({ children, handleCloseModal }: Props) {
    return (
        <div className="absolute inset-0 flex justify-center items-center z-40">
            <div className="relative max-h-[96%] mb-30 scrollbar-thin-custom">
                {handleCloseModal && (
                    <button
                        onClick={handleCloseModal}
                        className="bg-red-500 text-white absolute top-2 rounded-sm right-2 z-20"
                    >
                        <X />
                    </button>
                )}

                {children}
            </div>
        </div>
    );
}
