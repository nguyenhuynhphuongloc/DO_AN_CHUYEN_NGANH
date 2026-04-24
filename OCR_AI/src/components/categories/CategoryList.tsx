import type { FinanceCategoryCard } from "../../types/finance";

export function CategoryList({ categories }: { categories: FinanceCategoryCard[] }) {
  return (
    <div className="category-grid">
      {categories.map((category) => (
        <article key={category.id} className="category-card">
          <span className="category-card__pill" style={{ background: category.color }} />
          <strong>{category.name}</strong>
          <p>{category.description}</p>
          <span>{category.transactions} tracked entries</span>
        </article>
      ))}
    </div>
  );
}
