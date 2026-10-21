import { createEntityStore, dateOrNull } from "../../../platform/data/factory";
import { chemicalProfiles, type ChemicalProfile } from "@/lib/mock-data";

export const chemicalProfileStore = createEntityStore<ChemicalProfile>(
  "chemical-profiles",
  chemicalProfiles,
  {
    table: "chemical_profiles",
    select:
      "id, chemical_code, chemical_name, doc_type, doc_code, issued_by, issue_date, file_url, note",
    toEntity: (r) => ({
      id: r.id as string,
      chemicalCode: (r.chemical_code as string) ?? "",
      chemicalName: (r.chemical_name as string) ?? "",
      docType: (r.doc_type as ChemicalProfile["docType"]) ?? "CoA",
      docCode: (r.doc_code as string) ?? "",
      issuedBy: (r.issued_by as string) ?? "",
      issueDate: (r.issue_date as string) ?? "",
      fileUrl: (r.file_url as string) ?? "",
      note: (r.note as string) ?? "",
    }),
    toRow: (e) => {
      const r: Record<string, unknown> = {};
      if (e.chemicalCode !== undefined) r.chemical_code = e.chemicalCode;
      if (e.chemicalName !== undefined) r.chemical_name = e.chemicalName;
      if (e.docType !== undefined) r.doc_type = e.docType;
      if (e.docCode !== undefined) r.doc_code = e.docCode;
      if (e.issuedBy !== undefined) r.issued_by = e.issuedBy;
      if (e.issueDate !== undefined) r.issue_date = dateOrNull(e.issueDate);
      if (e.fileUrl !== undefined) r.file_url = e.fileUrl;
      if (e.note !== undefined) r.note = e.note;
      return r;
    },
  },
);
