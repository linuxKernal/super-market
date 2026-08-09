import { useSearchParams, Link } from "react-router";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";

function PaymentCallback() {
    const [searchParams] = useSearchParams();

    const isSuccess = searchParams.has("success");
    const errorMsg = searchParams.get("error");
    const isError = searchParams.has("error");

    if (isSuccess) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50/50 p-4">
                <Card className="max-w-md w-full shadow-lg border-green-100">
                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto bg-green-100 text-green-600 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                            <CheckCircle2 className="w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Payment Successful!</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Your payment has been processed successfully. Thank you for your purchase.
                        </CardDescription>
                    </CardHeader>

                    <CardFooter className="flex flex-col gap-3">
                        <Button asChild className="w-full bg-gray-900 text-white hover:bg-gray-800">
                            <Link to="/">
                                Home
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="h-full flex items-center justify-center bg-gray-50/50 p-4">
                <Card className="max-w-md w-full shadow-lg border-red-100">
                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto bg-red-100 text-red-600 w-16 h-16 flex items-center justify-center rounded-full mb-4">
                            <XCircle className="w-8 h-8" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-900">Payment Failed</CardTitle>
                        <CardDescription className="text-base mt-2 whitespace-pre-wrap">
                            {errorMsg || "An unknown error occurred during payment verification. Please try again."}
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="flex flex-col gap-3">
                        <Button asChild className="w-full bg-gray-900 text-white hover:bg-gray-800">
                            <Link to="/">
                                Home
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }


    return (
        <div className="h-full flex items-center justify-center bg-gray-50/50 p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center pt-8 pb-4">
                    <CardTitle className="text-xl font-bold text-gray-900">Processing Payment...</CardTitle>
                    <CardDescription className="mt-2">
                        Please wait while we verify your transaction details.
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center pb-8">
                    <div className="w-8 h-8 border-4 border-gray-200 border-t-primary rounded-full animate-spin"></div>
                </CardContent>
            </Card>
        </div>
    );
}

export default PaymentCallback;
