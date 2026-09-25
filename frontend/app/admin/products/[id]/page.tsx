import type { Metadata } from "next";
import { ProductEditor } from "@/app/admin/components/product-editor";

export const metadata: Metadata = {
  title: "Edit product"
};

type EditProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  return <ProductEditor productId={id} />;
}
