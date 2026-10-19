// Seed Neon từ mock-data.ts
// Chạy: npm run db:seed            (chỉ insert – dùng cho DB mới)
//       npm run db:seed -- --reset (XOÁ dữ liệu cũ trong các bảng rồi seed lại)
import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import {
  customers,
  staff,
  equipments,
  equipmentUsageLogs,
  maintenanceSchedule,
  environmentReadings,
  tools,
  chemicals,
  chemicalUsageLogs,
  testRequests,
  samples,
  archivedSamples,
  risks,
  opportunities,
  decisionRules,
  campaigns,
  samplingSessions,
  fieldSamples,
  services,
  customerFeedbacks,
  qcCharts,
  externalQCRounds,
  analysisResults,
} from "../src/lib/mock-data";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("❌ Thiếu DATABASE_URL trong .env.local");
  process.exit(1);
}

const sql = neon(url);
const ident = (name: string) => `"${name.replace(/"/g, '""')}"`;

type Row = Record<string, unknown>;

// Insert nhiều dòng trong 1 câu lệnh; Postgres tự ép kiểu theo định nghĩa
// bảng (json_populate_recordset) → text[], jsonb, date… đều đúng.
async function insert(table: string, rows: Row[]): Promise<{ id: string }[]> {
  if (rows.length === 0) return [];
  const cols = [...new Set(rows.flatMap(Object.keys))].map(ident).join(", ");
  return sql.query(
    `insert into public.${ident(table)} (${cols})
     select ${cols} from json_populate_recordset(null::public.${ident(table)}, $1::json)
     returning id`,
    [JSON.stringify(rows)],
  ) as unknown as Promise<{ id: string }[]>;
}

async function insertOne(table: string, row: Row) {
  const [created] = await insert(table, [row]);
  return created.id;
}

async function reset() {
  // Xóa theo thứ tự ngược dependency (children trước)
  const tables = [
    "analysis_audit_events",
    "analysis_results",
    "field_samples",
    "sampling_sessions",
    "chemical_usage_logs",
    "equipment_usage_logs",
    "maintenance_schedule",
    "environment_readings",
    "qc_points",
    "qc_charts",
    "external_qc_rounds",
    "archived_samples",
    "samples",
    "test_requests",
    "campaigns",
    "decision_rules",
    "risks",
    "opportunities",
    "customer_feedback",
    "services",
    "tools",
    "chemicals",
    "equipment",
    "staff",
    "customers",
  ];
  for (const t of tables) {
    try {
      await sql.query(`delete from public.${ident(t)}`);
    } catch (e) {
      console.warn(`⚠ Xóa ${t}: ${(e as Error).message}`);
    }
  }
}

async function seedCustomers() {
  await insert("customers",
    customers.map((c) => ({
      code: c.code,
      name: c.name,
      kind: c.kind,
      contact: c.contact,
      phone: c.phone,
      address: c.address,
      samples_ytd: c.samplesYTD,
      last_sample_at: c.lastSampleAt,
    })),
  );
  console.log(`✓ customers: ${customers.length}`);
}

async function seedStaff() {
  await insert("staff",
    staff.map((s) => ({
      code: s.code,
      full_name: s.fullName,
      position: s.position,
      department: s.department,
      email: s.email,
      phone: s.phone,
      joined_at: s.joinedAt,
      competencies: s.competencies,
      trainings: s.trainings,
      status: s.status,
    })),
  );
  console.log(`✓ staff: ${staff.length}`);
}

async function seedEquipment() {
  await insert("equipment",
    equipments.map((e) => ({
      code: e.code,
      name: e.name,
      model: e.model,
      location: e.location,
      last_calibration: e.lastCalibration,
      next_calibration: e.nextCalibration,
      status: e.status,
      usage_hours: e.usageHours,
    })),
  );
  console.log(`✓ equipment: ${equipments.length}`);

  await insert("equipment_usage_logs",
    equipmentUsageLogs.map((u) => ({
      equipment_code: u.equipmentCode,
      technician: u.technician,
      sample_code: u.sampleCode,
      started_at: u.startedAt,
      duration_min: u.durationMin,
    })),
  );
  console.log(`✓ equipment_usage_logs: ${equipmentUsageLogs.length}`);

  await insert("maintenance_schedule",
    maintenanceSchedule.map((m) => ({
      equipment_code: m.equipmentCode,
      kind: m.kind,
      scheduled_at: m.scheduledAt,
      vendor: m.vendor,
    })),
  );
  console.log(`✓ maintenance_schedule: ${maintenanceSchedule.length}`);

  await insert("environment_readings",
    environmentReadings.map((r) => ({
      room: r.room,
      monitoring_device: r.monitoringDevice,
      parameter: r.parameter,
      value: r.value,
      unit: r.unit,
      limit_text: r.limit,
      recorded_at: r.recordedAt,
      observer: r.observer,
      pass: r.pass,
      note: r.note ?? null,
    })),
  );
  console.log(`✓ environment_readings: ${environmentReadings.length}`);
}

async function seedTools() {
  await insert("tools",
    tools.map((t) => ({
      code: t.code,
      name: t.name,
      category: t.category,
      spec: t.spec,
      qty: t.qty,
      unit: t.unit,
      min_qty: t.minQty,
      location: t.location,
      calibration_required: t.calibrationRequired,
      last_calibration: t.lastCalibration ?? null,
      next_calibration: t.nextCalibration ?? null,
      status: t.status,
    })),
  );
  console.log(`✓ tools: ${tools.length}`);
}

async function seedChemicals() {
  await insert("chemicals",
    chemicals.map((c) => ({
      code: c.code,
      name: c.name,
      cas: c.cas,
      unit: c.unit,
      stock: c.stock,
      min_stock: c.minStock,
      expiry: c.expiry,
      hazard: c.hazard,
      location: c.location,
      technical_spec: c.technicalSpec,
      manufacturer: c.manufacturer,
      manufacture_date: c.manufactureDate,
      received_at: c.receivedAt,
      storage_condition: c.storageCondition,
      used_for: c.usedFor,
      is_reference: c.isReference ?? false,
    })),
  );
  console.log(`✓ chemicals: ${chemicals.length}`);

  await insert("chemical_usage_logs",
    chemicalUsageLogs.map((u) => ({
      chemical_code: u.chemicalCode,
      qty: u.qty,
      unit: u.unit,
      sample_code: u.sampleCode,
      method: u.method,
      technician: u.technician,
      used_at: u.usedAt,
    })),
  );
  console.log(`✓ chemical_usage_logs: ${chemicalUsageLogs.length}`);
}

async function seedTestRequests() {
  await insert("test_requests",
    testRequests.map((r) => ({
      code: r.code,
      customer: r.customer,
      customer_code: r.customerCode,
      contact: r.contact,
      phone: r.phone,
      matrix: r.matrix,
      expected_samples: r.expectedSamples,
      criteria: r.criteria,
      purpose: r.purpose,
      decision_rule: r.decisionRule,
      expected_delivery_days: r.expectedDeliveryDays,
      vat_rate: r.vatRate,
      notes: r.notes ?? null,
      status: r.status,
      contract_code: r.contractCode ?? null,
      linked_sample_codes: r.linkedSampleCodes ?? [],
      quoted_at: r.quotedAt ?? null,
      accepted_at: r.acceptedAt ?? null,
    })),
  );
  console.log(`✓ test_requests: ${testRequests.length}`);
}

async function seedSamples() {
  await insert("samples",
    samples.map((s) => ({
      code: s.code,
      customer: s.customer,
      type: s.type,
      received_at: s.receivedAt,
      due_at: s.dueAt,
      technician: s.technician,
      status: s.status,
      progress: s.progress,
      criteria: s.criteria,
    })),
  );
  console.log(`✓ samples: ${samples.length}`);
}

async function seedArchive() {
  await insert("archived_samples",
    archivedSamples.map((a) => ({
      archive_code: a.archiveCode,
      original_sample_code: a.originalSampleCode,
      customer: a.customer,
      type: a.type,
      archived_at: a.archivedAt,
      expiry_at: a.expiryAt,
      location: a.location,
      storage_condition: a.storageCondition,
      amount: a.amount,
      status: a.status,
      qc_analysis_at: a.qcAnalysisAt ?? null,
      qc_note: a.qcNote ?? null,
      purpose: a.purpose,
    })),
  );
  console.log(`✓ archived_samples: ${archivedSamples.length}`);
}

async function seedRisks() {
  await insert("risks",
    risks.map((r) => ({
      code: r.code,
      category: r.category,
      title: r.title,
      cause: r.cause,
      effect: r.effect,
      likelihood: r.likelihood,
      impact: r.impact,
      controls: r.controls,
      treatment: r.treatment,
      action: r.action,
      owner: r.owner,
      review_at: r.reviewAt,
      residual_likelihood: r.residualLikelihood,
      residual_impact: r.residualImpact,
      status: r.status,
      iso_clause: r.isoClause,
    })),
  );
  console.log(`✓ risks: ${risks.length}`);

  await insert("opportunities",
    opportunities.map((o) => ({
      title: o.title,
      description: o.description,
      expected_benefit: o.expectedBenefit,
      owner: o.owner,
      status: o.status,
    })),
  );
  console.log(`✓ opportunities: ${opportunities.length}`);
}

async function seedDecisionRules() {
  await insert("decision_rules",
    decisionRules.map((d) => ({
      criterion: d.criterion,
      matrix: d.matrix,
      method: d.method,
      unit: d.unit,
      limit_value: d.limit,
      limit_direction: d.limitDirection,
      limit_min: d.limitMin ?? null,
      limit_source: d.limitSource,
      uncertainty: d.uncertainty,
      rule_type: d.ruleType,
      acceptance_upper: d.acceptanceUpper ?? null,
      acceptance_lower: d.acceptanceLower ?? null,
      rejection_upper: d.rejectionUpper ?? null,
      rejection_lower: d.rejectionLower ?? null,
      notes: d.notes,
      approved_by: d.approvedBy,
      approved_at: d.approvedAt,
    })),
  );
  console.log(`✓ decision_rules: ${decisionRules.length}`);
}

async function seedCampaigns() {
  await insert("campaigns",
    campaigns.map((c) => ({
      code: c.code,
      name: c.name,
      scope: c.scope,
      area: c.area,
      client: c.client,
      funding_source: c.fundingSource,
      purpose: c.purpose,
      matrix: c.matrix,
      criteria: c.criteria,
      planned_points: c.plannedPoints,
      collected_samples: c.collectedSamples,
      analyzed_samples: c.analyzedSamples,
      start_date: c.startDate,
      end_date: c.endDate,
      status: c.status,
      leader: c.leader,
      report_code: c.reportCode ?? null,
      report_published_at: c.reportPublishedAt ?? null,
      exceedance_count: c.exceedanceCount ?? null,
      points: c.points ?? [],
      trend: c.trend ?? [],
    })),
  );
  console.log(`✓ campaigns: ${campaigns.length}`);
}

async function seedField() {
  await insert("sampling_sessions",
    samplingSessions.map((s) => ({
      code: s.code,
      name: s.name,
      area: s.area,
      leader: s.leader,
      team: s.team,
      vehicle: s.vehicle,
      started_at: s.startedAt,
      ended_at: s.endedAt ?? null,
      customer: s.customer,
      matrix: s.matrix,
      status: s.status,
      planned_samples: s.plannedSamples,
      collected_samples: s.collectedSamples,
      synced_samples: s.syncedSamples,
    })),
  );
  console.log(`✓ sampling_sessions: ${samplingSessions.length}`);

  await insert("field_samples",
    fieldSamples.map((f) => ({
      field_code: f.fieldCode,
      session_code: f.sessionCode,
      matrix: f.matrix,
      collector_name: f.collectorName,
      collected_at: f.collectedAt,
      lat: f.location.lat,
      lng: f.location.lng,
      address: f.location.address,
      depth: f.depth ?? null,
      amount: f.amount,
      container: f.container,
      preservation: f.preservation,
      on_site_readings: f.onSiteReadings,
      photos: f.photos,
      has_signature: f.hasSignature,
      status: f.status,
      linked_sample_code: f.linkedSampleCode ?? null,
      notes: f.notes ?? null,
    })),
  );
  console.log(`✓ field_samples: ${fieldSamples.length}`);
}

async function seedServices() {
  await insert("services",
    services.map((s) => ({
      code: s.code,
      name: s.name,
      group_name: s.group,
      description: s.description,
      unit: s.unit,
      base_price: s.basePrice,
      turnaround: s.turnaround,
      methods: s.methods ?? [],
      vilas: s.vilas,
    })),
  );
  console.log(`✓ services: ${services.length}`);
}

async function seedFeedback() {
  await insert("customer_feedback",
    customerFeedbacks.map((f) => ({
      code: f.code,
      customer_name: f.customerName ?? null,
      customer_kind: f.customerKind ?? null,
      submitted_at: f.submittedAt,
      service_attitude: f.serviceAttitude,
      fee: f.fee,
      quality: f.quality,
      info_availability: f.infoAvailability,
      delivery_time: f.deliveryTime,
      comments: f.comments ?? null,
      is_complaint: f.isComplaint,
      complaint_status: f.complaintStatus ?? null,
      response_date: f.responseDate ?? null,
      responder: f.responder ?? null,
      response_note: f.responseNote ?? null,
    })),
  );
  console.log(`✓ customer_feedback: ${customerFeedbacks.length}`);
}

async function seedQC() {
  for (const c of qcCharts) {
    let id: string;
    try {
      id = await insertOne("qc_charts", {
        criterion: c.criterion,
        matrix: c.matrix,
        method: c.method,
        unit: c.unit,
        mean: c.mean,
        sd: c.sd,
        reference_material: c.referenceMaterial,
      });
    } catch (e) {
      console.warn(`⚠ qc_charts ${c.criterion}: ${(e as Error).message}`);
      continue;
    }
    await insert("qc_points",
      c.points.map((p) => ({
        chart_id: id,
        date: p.date,
        value: p.value,
        technician: p.technician,
      })),
    );
  }
  console.log(`✓ qc_charts: ${qcCharts.length}`);

  await insert("external_qc_rounds",
    externalQCRounds.map((r) => ({
      type: r.type,
      provider: r.provider,
      round: r.round,
      criterion: r.criterion,
      z: r.z,
      verdict: r.verdict,
      closed_at: r.closedAt,
    })),
  );
  console.log(`✓ external_qc_rounds: ${externalQCRounds.length}`);
}

async function seedAnalysisResults() {
  for (const r of analysisResults) {
    let id: string;
    try {
      id = await insertOne("analysis_results", {
        result_code: r.resultCode,
        sample_code: r.sampleCode,
        customer_name: r.customerName,
        matrix: r.matrix,
        criterion: r.criterion,
        unit: r.unit,
        method: r.method,
        instrument_code: r.instrument.code,
        instrument_name: r.instrument.name,
        reference_material: r.referenceMaterial,
        technician: r.technician,
        started_at: r.startedAt,
        finished_at: r.finishedAt ?? null,
        replicates: r.replicates,
        mean: r.mean,
        sd: r.sd,
        rsd: r.rsd,
        uncertainty: r.uncertainty,
        matrix_spike_recovery: r.matrixSpikeRecovery,
        blank_value: r.blankBlankValue,
        decision_rule_id: r.decisionRuleId,
        decision_rule_type: r.decisionRuleType,
        decision_limit: r.decisionLimit,
        acceptance_upper: r.acceptanceUpper,
        rejection_upper: r.rejectionUpper,
        conclusion: r.conclusion,
        conclusion_explanation: r.conclusionExplanation,
        raw_files: r.rawFiles,
        approvals: r.approvals,
        status: r.status,
        qa_comment: r.qaComment ?? null,
        manager_comment: r.managerComment ?? null,
      });
    } catch (e) {
      console.warn(`⚠ analysis_results ${r.resultCode}: ${(e as Error).message}`);
      continue;
    }
    await insert("analysis_audit_events",
      r.auditTrail.map((e) => ({
        result_id: id,
        at: e.at,
        actor: e.actor,
        action: e.action,
        detail: e.detail ?? null,
        field: e.field ?? null,
        old_value: e.oldValue ?? null,
        new_value: e.newValue ?? null,
      })),
    );
  }
  console.log(`✓ analysis_results: ${analysisResults.length}`);
}

async function main() {
  if (process.argv.includes("--reset")) {
    console.log("→ Reset tables...");
    await reset();
  }
  console.log("→ Seeding...");
  await seedCustomers();
  await seedStaff();
  await seedEquipment();
  await seedTools();
  await seedChemicals();
  await seedTestRequests();
  await seedSamples();
  await seedArchive();
  await seedRisks();
  await seedDecisionRules();
  await seedCampaigns();
  await seedField();
  await seedServices();
  await seedFeedback();
  await seedQC();
  await seedAnalysisResults();
  console.log("✅ Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => process.exit(0));
