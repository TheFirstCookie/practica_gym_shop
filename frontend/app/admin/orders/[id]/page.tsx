import type { Metadata } from "next";
import { OrderDetail } from "@/app/admin/components/order-detail";

export const metadata: Metadata = {
  title: "Order"
};

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
