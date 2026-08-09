import { useEffect, useState, useRef, type RefObject } from "react";

export function useOnScreen(
    options = { threshold: 1.0, rootMargin: "0px" }
): [RefObject<null>, boolean] {
    const targetRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setIsVisible(entry.isIntersecting);
            },
            { ...options, root: null }
        );

        const currentRef = targetRef.current;

        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
        };
    }, [options.threshold, options.rootMargin, options]);

    return [targetRef, isVisible];
}
