import type { Metadata } from "next";
import { AccountPage } from "../../components/account-page";
import { OrderView } from "../../components/order-view";

export const metadata: Metadata = {
  title: "Order"
};

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  return (
    <AccountPage>
      <OrderView orderId={id} />
    </AccountPage>
  );
}
