type AdminDataTableProps<T extends Record<string, any>> = {
  columns: Array<{
    key: keyof T | string
    label: string
    render?: (row: T) => React.ReactNode
  }>
  emptyText?: string
  rows: T[]
}

export function AdminDataTable<T extends Record<string, any>>({ columns, emptyText = 'Không có bản ghi phù hợp.', rows }: AdminDataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="fin-admin-empty">
        <strong>Không có dữ liệu</strong>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <div className="fin-admin-table-wrap">
      <table className="fin-admin-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={String(column.key)}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={String(row.id ?? rowIndex)}>
              {columns.map((column) => (
                <td key={String(column.key)}>{column.render ? column.render(row) : String(row[column.key] ?? '')}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
