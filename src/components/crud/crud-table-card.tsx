import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteEntityButton } from "@/components/crud/delete-button";
import {
  EntityFormDialog,
  type CrudField,
} from "@/components/crud/entity-form-dialog";

export type CrudRow = {
  id: string;
  label: string;
  initial: Record<string, unknown>;
  cells: React.ReactNode[];
};

export function CrudTableCard({
  title,
  description,
  endpoint,
  entity,
  editFields,
  addNode,
  headers,
  rows,
  emptyText = "Chưa có dữ liệu",
}: {
  title: string;
  description: string;
  endpoint: string;
  entity: string;
  editFields: CrudField[];
  addNode: React.ReactNode;
  headers: string[];
  rows: CrudRow[];
  emptyText?: string;
}) {
  return (
    <section>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {addNode}
        </CardHeader>
        <CardContent>
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50 hover:bg-muted/50 border-0">
                  {headers.map((h) => (
                    <TableHead
                      key={h}
                      className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {h}
                    </TableHead>
                  ))}
                  <TableHead className="w-[160px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={headers.length + 1}
                      className="text-center text-sm text-muted-foreground py-8"
                    >
                      {emptyText}
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow
                    key={r.id}
                    className="hover:bg-primary/[0.04] transition-colors"
                  >
                    {r.cells.map((c, i) => (
                      <TableCell key={i}>{c}</TableCell>
                    ))}
                    <TableCell>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Không có trường sửa (VD phiếu kho chỉ xóa) → ẩn nút Sửa. */}
                        {editFields.length > 0 && (
                          <EntityFormDialog
                            mode="edit"
                            endpoint={endpoint}
                            id={r.id}
                            title={`Sửa – ${title}`}
                            fields={editFields}
                            initial={r.initial}
                            submitLabel="Lưu thay đổi"
                          />
                        )}
                        <DeleteEntityButton
                          entity={entity}
                          id={r.id}
                          label={r.label}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
