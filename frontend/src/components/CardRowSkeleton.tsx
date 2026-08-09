import CardskeletonLoading from "./CardskeletonLoading";

export default function CardRowSkeleton() {
    return (
        <div className="w-full px-4">
            <div className="mb-4 animate-pulse flex justify-between">
                <h2 className="bg-neutral-200 w-56 h-6 rounded-lg"></h2>
                <span className="bg-neutral-200 w-16 h-4 rounded-lg"></span>
            </div>
            <div className="relative  flex justify-center gap-x-4">
                {Array.from({ length: 6 }, (_, index) => (
                    <CardskeletonLoading key={index} />
                ))}
            </div>
        </div>
    );
}
