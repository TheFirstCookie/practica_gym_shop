import type { Metadata } from "next";
import { BrandManager } from "../components/brand-manager";

export const metadata: Metadata = {
  title: "Brands"
};

export default function AdminBrandsPage() {
  return <BrandManager />;
}
