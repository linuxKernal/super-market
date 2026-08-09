import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

import categoriesList from "@/data/category";
import { Link } from "react-router";

export default function CategoryList() {
    return (
        <div className="px-4 py-8 max-w-screen">
            <Carousel>
                <CarouselContent className="px-12">
                    {categoriesList.map((item) => {
                        return (
                            <CarouselItem
                                className="max-w-[7rem]"
                                key={item.id}
                            >
                                <Link
                                    className="flex flex-col items-center text-wrap"
                                    to={`/categories/${item.id}/products`}
                                >
                                    <img
                                        src={item.image}
                                        className="size-20"
                                        alt=""
                                    />
                                    <p>{item.label || "Categoty"}</p>
                                </Link>
                            </CarouselItem>
                        );
                    })}
                </CarouselContent>
                <div className="absolute top-1/2 left-2 flex items-center justify-center">
                    <CarouselPrevious className="relative left-0 translate-x-0 hover:translate-x-0 hover:bg-primary/90" />
                </div>
                <div className="absolute top-1/2 right-2 flex items-center justify-center">
                    <CarouselNext className="relative right-0 translate-x-0 hover:translate-x-0 hover:bg-primary/90" />
                </div>
            </Carousel>
        </div>
    );
}
