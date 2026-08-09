import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

import { type Product } from "./Products";
import { Link } from "react-router";
import ProductCard from "./ProductCard";

interface Props {
    name: string;
    id: number;
    products: Product[];
}

export default function ProductRow({ name, products, id }: Props) {
    return (
        <div className="w-[98vw]">
            <div className="flex justify-between">
                <h2 className="text-2xl font-semibold pb-4 pl-4">{name}</h2>
                <Link
                    to={`/categories/${id}/products`}
                    className="text-green-400"
                >
                    Show all
                </Link>
            </div>
            <Carousel className="">
                <CarouselContent className="px-12">
                    {products.map((item) => {
                        return (
                            <CarouselItem
                                className="flex max-w-fit"
                                key={item.id}
                            >
                                <ProductCard product={item} />
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
