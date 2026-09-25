import type { Metadata } from "next";
import { CategoryManager } from "../components/category-manager";

export const metadata: Metadata = {
  title: "Categories"
};

export default function AdminCategoriesPage() {
  return <CategoryManager />;
}
