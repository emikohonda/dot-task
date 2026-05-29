// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const INIT_ORG_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  const databaseUrl = process.env.DATABASE_URL ?? "";

  if (databaseUrl.includes("neon.tech")) {
    throw new Error("❌ Neon DBでは seed.ts を実行しないでください。ローカルDBでのみ実行してください。");
  }

  // 掃除
  await prisma.scheduleContractor.deleteMany();
  await prisma.scheduleEmployee.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.siteCompanyContact.deleteMany();
  await prisma.siteContractor.deleteMany();
  await prisma.site.deleteMany();
  await prisma.contractorContact.deleteMany();
  await prisma.contractor.deleteMany();
  await prisma.companyContact.deleteMany();
  await prisma.company.deleteMany();
  await prisma.employee.deleteMany();

  // 初期Organization
  const initOrg = await prisma.organization.upsert({
    where:  { id: INIT_ORG_ID },
    update: {},
    create: { id: INIT_ORG_ID, name: "自社（初期）" },
  });

  // Company
  const company = await prisma.company.create({
    data: {
      organizationId: initOrg.id,
      name: "テスト元請（Seed）",
      postalCode: "000-0000",
      address: "広島市（Seed）",
      phone: "082-000-0000",
      email: "seed_company@example.com",
    },
  });

  // Site
  const site = await prisma.site.create({
    data: {
      organizationId: initOrg.id,
      name: "なんちゃって建設（Seed）",
      address: "広島市〇〇（Seed）",
      companyId: company.id,
      startDate: new Date("2026-02-01"),
      endDate:   new Date("2026-04-30"),
    },
  });

  // CompanyContacts
  const cc1 = await prisma.companyContact.create({
    data: { companyId: company.id, name: "田中（元請担当・Seed）", phone: "082-111-1111", email: "tanaka_company@example.com" },
  });
  const cc2 = await prisma.companyContact.create({
    data: { companyId: company.id, name: "佐藤（元請担当・Seed）", phone: "082-222-2222", email: "sato_company@example.com" },
  });

  await prisma.siteCompanyContact.createMany({
    data: [
      { siteId: site.id, companyContactId: cc1.id },
      { siteId: site.id, companyContactId: cc2.id },
    ],
    skipDuplicates: true,
  });

  // Contractors
  const c1 = await prisma.contractor.create({ data: { organizationId: initOrg.id, name: "テスト外注A（Seed）" } });
  const c2 = await prisma.contractor.create({ data: { organizationId: initOrg.id, name: "テスト外注B（Seed）" } });

  // Employees
  const e1 = await prisma.employee.create({ data: { organizationId: initOrg.id, name: "山田（Seed）" } });
  const e2 = await prisma.employee.create({ data: { organizationId: initOrg.id, name: "田中（Seed）" } });
  const e3 = await prisma.employee.create({ data: { organizationId: initOrg.id, name: "佐藤（Seed）" } });

  // Schedules
  await prisma.schedule.create({
    data: {
      organizationId: initOrg.id,
      siteId: site.id,
      title: "養生（Seed）",
      date: new Date("2026-02-27"),
      startTime: "09:00",
      endTime: "12:00",
      description: "Seedデータ：注意点など",
      contractors: { createMany: { data: [{ contractorId: c1.id }, { contractorId: c2.id }], skipDuplicates: true } },
      employees:   { createMany: { data: [{ employeeId: e1.id }, { employeeId: e2.id }],   skipDuplicates: true } },
    },
  });

  await prisma.schedule.create({
    data: {
      organizationId: initOrg.id,
      siteId: site.id,
      title: "搬入（Seed）",
      date: new Date("2026-02-28"),
      contractors: { createMany: { data: [{ contractorId: c1.id }],                       skipDuplicates: true } },
      employees:   { createMany: { data: [{ employeeId: e2.id }, { employeeId: e3.id }],   skipDuplicates: true } },
    },
  });

  console.log("✅ Seed done");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
