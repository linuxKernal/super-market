import { useEffect, useState, useCallback } from "react";

interface UseRecaptchaEnterpriseReturn {
    execute: (actionName: string) => Promise<any>;
    isReady: boolean;
}

export function useRecaptchaEnterprise(
    siteKey: string
): UseRecaptchaEnterpriseReturn {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (window?.grecaptcha?.enterprise) {
            window.grecaptcha.enterprise.ready(() => setIsReady(true));
            return;
        }

        const script = document.createElement("script");
        script.src = `https://www.google.com/recaptcha/enterprise.js?render=${siteKey}`;
        script.async = true;
        script.defer = true;
        script.onload = () => {
            window.grecaptcha?.enterprise?.ready(() => setIsReady(true));
        };

        document.head.appendChild(script);
    }, [siteKey]);

    const execute = useCallback(
        async (actionName: string): Promise<any> => {
            if (!isReady || !window.grecaptcha?.enterprise) {
                throw new Error(
                    "reCAPTCHA Enterprise script is not loaded yet."
                );
            }
            return await window.grecaptcha.enterprise.execute(siteKey, {
                action: actionName,
            });
        },
        [isReady, siteKey]
    );

    return { execute, isReady };
}
