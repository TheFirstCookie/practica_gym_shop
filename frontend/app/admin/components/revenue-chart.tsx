"use client";

import { useId, useState } from "react";
import type { Dashboard } from "@/lib/api/types";
import { formatPrice } from "@/lib/format";

type Day = Dashboard["daily"][number];

const dayLabel = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const longDayLabel = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC"
});

/** "2026-09-25" is a UTC day from the API; format it without shifting to local time. */
const toDate = (date: string) => new Date(`${date}T00:00:00Z`);

/** Rounds the top of the axis up to a clean value (1, 2, 2.5 or 5 x 10^n) in 4 steps. */
function niceScale(maxCents: number): number[] {
  if (maxCents <= 0) return [0, 2500, 5000, 7500, 10000];
  const rough = maxCents / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rough)!;
  return [0, 1, 2, 3, 4].map((index) => index * step);
}

/** "$12,500" -> "$12.5K" on the axis, where space is tight. */
function compactPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    notation: "compact",
    maximumFractionDigits: 1
  }).format(cents / 100);
}

const countOrders = (count: number) => `${count} ${count === 1 ? "order" : "orders"}`;

function describeDay(day: Day, currency: string) {
  const date = longDayLabel.format(toDate(day.date));
  return `${date}: ${formatPrice(day.revenueCents, currency)}, ${countOrders(day.orderCount)}`;
}

type RevenueChartProps = {
  daily: Day[];
  currency: string;
};

/**
 * Daily revenue as columns, one per day. Every column is focusable and shows its day,
 * revenue and order count on hover or focus; the same numbers are in the table below.
 */
export function RevenueChart({ daily, currency }: RevenueChartProps) {
  const tableId = useId();
  const [active, setActive] = useState<number | null>(null);
  const ticks = niceScale(Math.max(0, ...daily.map((day) => day.revenueCents)));
  const top = ticks[ticks.length - 1];
  const activeDay = active === null ? null : daily[active];
  // Label a handful of days along the x axis, never all of them: every nth day, plus the
  // last one, skipping a regular label that would crowd it.
  const labelEvery = Math.ceil(daily.length / 5);
  const last = daily.length - 1;
  const showLabel = (index: number) =>
    index === last || (index % labelEvery === 0 && last - index >= labelEvery);

  return (
    <figure className="revenue-chart">
      <div className="revenue-chart-plot" onPointerLeave={() => setActive(null)}>
        <div className="revenue-chart-grid" aria-hidden="true">
          {ticks
            .slice()
            .reverse()
            .map((tick) => (
              <div key={tick} className="revenue-chart-gridline">
                <span>{compactPrice(tick, currency)}</span>
              </div>
            ))}
        </div>

        <div className="revenue-chart-bars" role="list" aria-label="Revenue per day" aria-describedby={tableId}>
          {daily.map((day, index) => (
            <div
              key={day.date}
              role="listitem"
              tabIndex={0}
              className="revenue-chart-slot"
              data-active={active === index || undefined}
              aria-label={describeDay(day, currency)}
              onPointerEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              onBlur={() => setActive(null)}
            >
              <span
                className="revenue-chart-bar"
                style={{ height: `${top ? (day.revenueCents / top) * 100 : 0}%` }}
                data-empty={day.revenueCents === 0 || undefined}
              />
            </div>
          ))}
        </div>

        {activeDay && active !== null && (
          <div
            className="revenue-chart-tooltip"
            role="presentation"
            style={{ left: `${((active + 0.5) / daily.length) * 100}%` }}
            data-edge={active < daily.length * 0.15 ? "start" : active > daily.length * 0.85 ? "end" : undefined}
          >
            <strong>{formatPrice(activeDay.revenueCents, currency)}</strong>
            <span>{countOrders(activeDay.orderCount)}</span>
            <small>{longDayLabel.format(toDate(activeDay.date))}</small>
          </div>
        )}
      </div>

      <div className="revenue-chart-axis" aria-hidden="true">
        {daily.map((day, index) => (
          <span key={day.date}>
            {showLabel(index) ? dayLabel.format(toDate(day.date)) : ""}
          </span>
        ))}
      </div>

      <details className="revenue-chart-table">
        <summary>View as table</summary>
        <table id={tableId}>
          <thead>
            <tr>
              <th scope="col">Day</th>
              <th scope="col" className="numeric">
                Orders
              </th>
              <th scope="col" className="numeric">
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {daily
              .slice()
              .reverse()
              .map((day) => (
                <tr key={day.date}>
                  <td>{longDayLabel.format(toDate(day.date))}</td>
                  <td className="numeric">{day.orderCount}</td>
                  <td className="numeric">{formatPrice(day.revenueCents, currency)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
