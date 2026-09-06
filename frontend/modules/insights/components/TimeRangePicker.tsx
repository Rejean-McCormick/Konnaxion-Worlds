// FILE: frontend/modules/insights/components/TimeRangePicker.tsx
"use client";
import { DatePicker } from "antd";
import dayjs from "dayjs";

type Range = [dayjs.Dayjs, dayjs.Dayjs];

export default function TimeRangePicker({
  value,
  onChange,
}: {
  value: Range;
  onChange: (val: Range) => void;
}) {
  return (
    <DatePicker.RangePicker
      className="mb-6"
      value={value}
      onChange={(val) => onChange(val as Range)}
      allowClear={false}
    />
  );
}

