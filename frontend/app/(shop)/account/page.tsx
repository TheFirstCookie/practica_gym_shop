import type { Metadata } from "next";
import { AccountPage } from "./components/account-page";
import { OrderList } from "./components/order-list";

export const metadata: Metadata = {
  title: "Your orders"
};

export default function OrdersPage() {
  return (
    <AccountPage>
      <OrderList />
    </AccountPage>
  );
}
