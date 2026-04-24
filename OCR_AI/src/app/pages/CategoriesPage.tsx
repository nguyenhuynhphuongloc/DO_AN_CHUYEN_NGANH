import { CategoryList } from "../../components/categories/CategoryList";
import { PageShell } from "../../components/layout/PageShell";
import { categoryCards } from "../../mocks/finance";

export function CategoriesPage() {
  return (
    <PageShell
      eyebrow="Categories"
      title="Custom category labels"
      description="Shape how the finance system groups and presents transactions."
      action={<button className="button button--accent">Create category</button>}
    >
      <CategoryList categories={categoryCards} />
    </PageShell>
  );
}
