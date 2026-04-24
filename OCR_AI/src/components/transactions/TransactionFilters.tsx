import { FilterBar } from "../shared/FilterBar";
import { SearchInput } from "../shared/SearchInput";

export function TransactionFilters({
  search,
  onSearch,
  type,
  onType,
  category,
  onCategory
}: {
  search: string;
  onSearch: (value: string) => void;
  type: string;
  onType: (value: string) => void;
  category: string;
  onCategory: (value: string) => void;
}) {
  return (
    <FilterBar>
      <SearchInput value={search} onChange={onSearch} placeholder="Search merchant or title" />
      <select className="field-control" value={type} onChange={(event) => onType(event.target.value)}>
        <option value="all">All types</option>
        <option value="income">Income</option>
        <option value="expense">Expense</option>
        <option value="transfer">Transfer</option>
      </select>
      <select className="field-control" value={category} onChange={(event) => onCategory(event.target.value)}>
        <option value="all">All categories</option>
        <option value="Dining">Dining</option>
        <option value="Transport">Transport</option>
        <option value="Utilities">Utilities</option>
        <option value="Investments">Investments</option>
      </select>
    </FilterBar>
  );
}
