import PaymentSuccessPage from "../../../components/paymentSuccessPage";

// En Next.js 15, searchParams es una Promise — hay que awaitearlo
export default async function Page({ searchParams }) {
    const params = await searchParams;
    const orderId = params?.order;

    return <PaymentSuccessPage orderId={orderId} />;
}
