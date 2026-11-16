import { describe, expect, it } from "vitest";
import { balances, budgetItemAmount, dailyAllowance, expenseShares, installmentSchedule, settle } from "./budget";
import { convert, feesFor } from "./fx";

describe("câmbio", () => {
  it("applies IOF + spread only to foreign card payments", () => {
    expect(feesFor("EUR", "BRL", "credit", 3.5, 4)).toBe(7.5);
    expect(feesFor("EUR", "BRL", "cash", 3.5, 4)).toBe(0);
    expect(feesFor("BRL", "BRL", "credit", 3.5, 4)).toBe(0);
  });
  it("converts with fees", () => {
    expect(convert(100, 6, 7.5)).toBe(645);
  });
});

describe("orçamento", () => {
  it("daily estimate = value/day × days × people", () => {
    expect(budgetItemAmount({ kind: "daily", amount: 35, days: 10, people: 2 })).toBe(700);
  });
  it("splits card installments by month", () => {
    const s = installmentSchedule(1000, 3, "2026-10-01");
    expect(s.map((x) => x.month)).toEqual(["2026-10", "2026-11", "2026-12"]);
    expect(s.reduce((a, x) => a + x.amount, 0)).toBeCloseTo(1000);
  });
  it("daily allowance spreads remaining budget", () => {
    expect(dailyAllowance(1000, 50, 5)).toBe(150);
  });
});

describe("divisão", () => {
  const T = ["a", "b", "c"];
  it("splits equally among everyone by default", () => {
    expect(expenseShares({ converted_amount: 90, amount: 90, paid_by: "a", split_mode: "equal", splits: [] }, T)).toEqual({ a: 30, b: 30, c: 30 });
  });
  it("splits by percent", () => {
    const s = expenseShares({ converted_amount: 200, amount: 200, paid_by: "a", split_mode: "percent", splits: [{ traveler_id: "a", value: 25 }, { traveler_id: "b", value: 75 }] }, T);
    expect(s).toEqual({ a: 50, b: 150 });
  });
  it("settles with minimum transfers", () => {
    const b = balances([
      { converted_amount: 90, amount: 90, paid_by: "a", split_mode: "equal", splits: [] },
      { converted_amount: 30, amount: 30, paid_by: "b", split_mode: "equal", splits: [] },
    ], T);
    expect(settle(b)).toEqual([{ from: "c", to: "a", amount: 40 }, { from: "b", to: "a", amount: 10 }]);
  });
});
