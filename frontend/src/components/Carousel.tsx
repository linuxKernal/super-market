import {
    Carousel as C,
    CarouselContent,
    CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";

import Image1 from "../assets/cover_image.jpg";
import Image2 from "../assets/cover_image1.jpg";
import Image3 from "../assets/cover_image2.jpg";

export default function Carousel() {
    return (
        <div className="max-w-screen">
            <C
                className=""
                opts={{
                    loop: true,
                }}
                plugins={[
                    Autoplay({
                        delay: 4000,
                    }),
                ]}
            >
                <CarouselContent className="">
                    <CarouselItem className="h-96 pl-0">
                        <img
                            src={Image1}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </CarouselItem>
                    <CarouselItem className="h-96 pl-0">
                        <img
                            src={Image2}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </CarouselItem>
                    <CarouselItem className="h-96 pl-0">
                        <img
                            src={Image3}
                            className="w-full h-full object-cover"
                            alt=""
                        />
                    </CarouselItem>
                </CarouselContent>
                {/* <CarouselPrevious /> */}
                {/* <CarouselNext /> */}
            </C>
        </div>
    );
}
