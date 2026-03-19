// prisma/seed.ts
import { PrismaClient, ScheduleStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // ✅ 掃除（中間 → 本体の順で）
  await prisma.scheduleContractor.deleteMany();
  await prisma.scheduleEmployee.deleteMany();
  await prisma.schedule.deleteMany();

  await prisma.siteCompanyContact.deleteMany(); // ✅ 追加（site/company より先）

  await prisma.siteContractor.deleteMany();
  await prisma.site.deleteMany();

  await prisma.contractorContact.deleteMany();
  await prisma.contractor.deleteMany();

  await prisma.companyContact.deleteMany();
  await prisma.company.deleteMany();

  await prisma.employee.deleteMany();
  

  // Company
  const company = await prisma.company.create({
    data: {
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
      name: "なんちゃって建設（Seed）",
      address: "広島市〇〇（Seed）",
      companyId: company.id,
      startDate: new Date("2026-02-01"),
      endDate: new Date("2026-04-30"),
    },
  });

    // ✅ CompanyContacts（元請担当者）
  const cc1 = await prisma.companyContact.create({
    data: {
      companyId: company.id,
      name: "田中（元請担当・Seed）",
      phone: "082-111-1111",
      email: "tanaka_company@example.com",
    },
  });

  const cc2 = await prisma.companyContact.create({
    data: {
      companyId: company.id,
      name: "佐藤（元請担当・Seed）",
      phone: "082-222-2222",
      email: "sato_company@example.com",
    },
  });

  // ✅ Site と担当者を紐付け（複数）
  await prisma.siteCompanyContact.createMany({
    data: [
      { siteId: site.id, companyContactId: cc1.id },
      { siteId: site.id, companyContactId: cc2.id },
    ],
    skipDuplicates: true,
  });

  // Contractors
  const c1 = await prisma.contractor.create({ data: { name: "テスト外注A（Seed）" } });
  const c2 = await prisma.contractor.create({ data: { name: "テスト外注B（Seed）" } });

  // ✅ Employees（名簿）
  const e1 = await prisma.employee.create({ data: { name: "山田（Seed）" } });
  const e2 = await prisma.employee.create({ data: { name: "田中（Seed）" } });
  const e3 = await prisma.employee.create({ data: { name: "佐藤（Seed）" } });

  // Schedule（協力会社2社 + 社員2名を紐づけ）
  await prisma.schedule.create({
    data: {
      siteId: site.id,
      title: "養生（Seed）",
      date: new Date("2026-02-27"),
      status: ScheduleStatus.TODO,
      startTime: "09:00",
      endTime: "12:00",
      description: "Seedデータ：注意点など",
      contractors: {
        createMany: {
          data: [{ contractorId: c1.id }, { contractorId: c2.id }],
          skipDuplicates: true,
        },
      },
      employees: {
        createMany: {
          data: [{ employeeId: e1.id }, { employeeId: e2.id }],
          skipDuplicates: true,
        },
      },
    },
  });

  // もう1件あってもUI検証が捗る（任意）
  await prisma.schedule.create({
    data: {
      siteId: site.id,
      title: "搬入（Seed）",
      date: new Date("2026-02-28"),
      status: ScheduleStatus.DOING,
      contractors: {
        createMany: {
          data: [{ contractorId: c1.id }],
          skipDuplicates: true,
        },
      },
      employees: {
        createMany: {
          data: [{ employeeId: e2.id }, { employeeId: e3.id }],
          skipDuplicates: true,
        },
      },
    },
  });

  console.log("✅ Seed done");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });