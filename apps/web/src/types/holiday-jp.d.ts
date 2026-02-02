// apps/web/src/types/holiday-jp.d.ts
declare module "holiday-jp" {
  export function between(
    start: Date,
    end: Date
  ): Array<{
    date: Date;
    name: string;
  }>;
}