"use client";

import { useState } from "react";
import { Users, Video, CheckSquare, TrendingUp, BarChart2, Activity } from "lucide-react";

export interface AnalyticsBatchData {
  id: string;
  name: string;
  courseTitle: string;
  studentCount: number;
  classesCount: number;
  attendancePct: number;
  assignmentSubmissionCount: number;
}

interface AnalyticsSectionProps {
  batches: AnalyticsBatchData[];
  totalStudents: number;
  totalClasses: number;
  avgAttendanceRate: number;
  assignmentEvalRate: number;
  quizPassRate: number;
}

type MetricMode = "learners" | "sessions" | "attendance";
type ChartType = "bars" | "trend";

export default function TrainerAnalyticsSection({
  batches,
  totalStudents,
  totalClasses,
  avgAttendanceRate,
  assignmentEvalRate,
  quizPassRate,
}: AnalyticsSectionProps) {
  const [metricMode, setMetricMode] = useState<MetricMode>("learners");
  const [chartType, setChartType] = useState<ChartType>("bars");
  const [activeSegmentIndex, setActiveSegmentIndex] = useState<number | null>(null);

  // Derive metric value for each cohort
  const getMetricValue = (b: AnalyticsBatchData) => {
    switch (metricMode) {
      case "learners":
        return b.studentCount;
      case "sessions":
        return b.classesCount;
      case "attendance":
        return b.attendancePct;
    }
  };

  const getMetricLabel = (val: number) => {
    switch (metricMode) {
      case "learners":
        return `${val} Students`;
      case "sessions":
        return `${val} Sessions`;
      case "attendance":
        return `${val}% Attendance`;
    }
  };

  const displayBatches = batches.slice(0, 6);
  const currentValues = displayBatches.map(getMetricValue);
  const rawMax = Math.max(...currentValues, 1);
  // Round up max for nice grid ticks
  const chartMax = metricMode === "attendance" ? 100 : Math.ceil(rawMax * 1.2) || 10;

  // Curated color palette
  const palette = [
    { fill: "#7C248C", grad: "url(#purpleGrad)", light: "#F5E8F7" },
    { fill: "#1E2B88", grad: "url(#blueGrad)", light: "#EAEFF9" },
    { fill: "#E01E6A", grad: "url(#pinkGrad)", light: "#FDE9F1" },
    { fill: "#0D9488", grad: "url(#tealGrad)", light: "#E6F6F4" },
    { fill: "#D97706", grad: "url(#amberGrad)", light: "#FEF3C7" },
    { fill: "#6366F1", grad: "url(#indigoGrad)", light: "#EEF2FF" },
  ];

  // SVG Chart Dimensions
  const svgWidth = 560;
  const svgHeight = 260;
  const paddingLeft = 46;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 45;

  const chartPlotWidth = svgWidth - paddingLeft - paddingRight;
  const chartPlotHeight = svgHeight - paddingTop - paddingBottom;

  // Grid tick values (4 steps)
  const yTicks = [
    chartMax,
    Math.round((chartMax * 3) / 4),
    Math.round((chartMax * 2) / 4),
    Math.round(chartMax / 4),
    0,
  ];

  // Column Bar & Coordinate calculations:
  // Instead of stretching points across the entire width (which pushes 2 items to the far left and far right),
  // divide the plotting area into equal slots and place each item at the center of its slot!
  const n = displayBatches.length;
  const slotWidth = n > 0 ? chartPlotWidth / n : chartPlotWidth;
  const colWidth = Math.min(42, Math.max(28, slotWidth * 0.45));

  // Function to get the X coordinate for any index, centered in its slot
  const getSlotCenterX = (index: number) => {
    return paddingLeft + index * slotWidth + slotWidth / 2;
  };

  // Line & Area chart path calculation
  const points = displayBatches.map((b, i) => {
    const val = getMetricValue(b);
    const x = getSlotCenterX(i);
    const y = paddingTop + chartPlotHeight - (val / chartMax) * chartPlotHeight;
    return { x, y, val, batch: b };
  });

  const linePathD = points.length > 0
    ? points.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")
    : "";

  const areaPathD = points.length > 0
    ? `${linePathD} L ${points[points.length - 1].x} ${paddingTop + chartPlotHeight} L ${points[0].x} ${paddingTop + chartPlotHeight} Z`
    : "";

  // Donut / Pie share calculation
  const pieData = displayBatches.map((b, idx) => ({
    label: b.name,
    sublabel: b.courseTitle,
    value: getMetricValue(b),
    color: palette[idx % palette.length].fill,
  }));

  const pieTotal = pieData.reduce((sum, d) => sum + d.value, 0) || 1;
  let cumulativeAngle = 0;
  const donutRadius = 64;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * donutRadius;
  const donutCenter = 90;

  const donutSlices = pieData.map((slice) => {
    const sliceFraction = slice.value / pieTotal;
    const strokeDasharray = `${sliceFraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += sliceFraction;
    return {
      ...slice,
      strokeDasharray,
      strokeDashoffset,
      percentage: Math.round(sliceFraction * 100),
    };
  });

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
      {/* Top Header & Interactive Segmented Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#7C248C]">
            <TrendingUp className="w-4 h-4" /> Academic Analytics Studio
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Cohort Performance & Comparative Analysis
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Analyze distributions and trends across Learners, Live Sessions, and Class Attendance.
          </p>
        </div>

        {/* Dual Parameter Selector Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
          {/* Visual Type Toggle: Vertical Bars vs Curve Trend Line */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/90 shadow-2xs">
            <button
              onClick={() => setChartType("bars")}
              title="Column Bar Graph"
              className={`p-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === "bars"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Columns</span>
            </button>
            <button
              onClick={() => setChartType("trend")}
              title="Curve Trend Line Chart"
              className={`p-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                chartType === "trend"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trend Line</span>
            </button>
          </div>

          {/* Metric Selector Tabs */}
          <div className="inline-flex p-1 rounded-2xl bg-slate-100/90 border border-slate-200/90 gap-1 shadow-2xs">
            <button
              onClick={() => setMetricMode("learners")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                metricMode === "learners"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#1E2B88]" />
              <span>Learners</span>
            </button>

            <button
              onClick={() => setMetricMode("sessions")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                metricMode === "sessions"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-rose-600" />
              <span>Sessions</span>
            </button>

            <button
              onClick={() => setMetricMode("attendance")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                metricMode === "attendance"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>Attendance %</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Analytical Visuals: SVG Graph + Donut Ratio Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Left Column (7 cols): Analytical Bar Graph / Line Chart */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <span>{chartType === "bars" ? "Vertical Column Analysis" : "Cohort Curve Distribution"}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="text-[#7C248C] capitalize">{metricMode}</span>
            </span>

            <span className="text-xs font-mono font-extrabold text-slate-700">
              {metricMode === "learners" && `Total: ${totalStudents} Students`}
              {metricMode === "sessions" && `Total: ${totalClasses} Classes`}
              {metricMode === "attendance" && `Institute Avg: ${avgAttendanceRate}%`}
            </span>
          </div>

          {/* SVG Canvas Area */}
          <div className="relative w-full rounded-2xl border border-slate-200/90 bg-slate-50/50 p-4 sm:p-5 flex items-center justify-center overflow-hidden">
            {displayBatches.length > 0 ? (
              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto max-h-[300px] overflow-visible"
              >
                <defs>
                  {/* Linear Gradients for visual depth */}
                  <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C248C" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#7C248C" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1E2B88" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#1E2B88" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="pinkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E01E6A" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#E01E6A" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0D9488" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#0D9488" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="amberGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#D97706" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#D97706" stopOpacity="0.35" />
                  </linearGradient>
                  <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366F1" stopOpacity="0.95" />
                    <stop offset="100%" stopColor="#6366F1" stopOpacity="0.35" />
                  </linearGradient>

                  {/* Area fill gradient for trend mode */}
                  <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7C248C" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#7C248C" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid Lines */}
                {yTicks.map((tick, i) => {
                  const y = paddingTop + (i * chartPlotHeight) / (yTicks.length - 1);
                  return (
                    <g key={i}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2={svgWidth - paddingRight}
                        y2={y}
                        stroke="#E2E8F0"
                        strokeDasharray={i === yTicks.length - 1 ? "none" : "3 3"}
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 8}
                        y={y + 3.5}
                        textAnchor="end"
                        className="text-[10px] fill-slate-400 font-mono font-medium"
                      >
                        {tick}
                        {metricMode === "attendance" ? "%" : ""}
                      </text>
                    </g>
                  );
                })}

                {/* MODE A: VERTICAL COLUMN BARS */}
                {chartType === "bars" &&
                  displayBatches.map((batch, idx) => {
                    const val = getMetricValue(batch);
                    const barHeight = Math.max((val / chartMax) * chartPlotHeight, val > 0 ? 6 : 2);
                    const centerBarX = getSlotCenterX(idx);
                    const x = centerBarX - colWidth / 2;
                    const y = paddingTop + chartPlotHeight - barHeight;
                    const color = palette[idx % palette.length];
                    const isHovered = activeSegmentIndex === idx;

                    return (
                      <g
                        key={batch.id}
                        onMouseEnter={() => setActiveSegmentIndex(idx)}
                        onMouseLeave={() => setActiveSegmentIndex(null)}
                        className="cursor-pointer transition-all"
                      >
                        {/* Column Bar with Rounded Top */}
                        <rect
                          x={x}
                          y={y}
                          width={colWidth}
                          height={barHeight}
                          rx="8"
                          fill={color.grad}
                          stroke={isHovered ? color.fill : "transparent"}
                          strokeWidth="2"
                          className="transition-all duration-500 ease-out hover:opacity-90"
                        />

                        {/* Top Value Tooltip Pill */}
                        <text
                          x={centerBarX}
                          y={y - 8}
                          textAnchor="middle"
                          className={`text-[10px] font-mono font-bold transition-opacity ${
                            isHovered ? "fill-slate-900 opacity-100" : "fill-slate-500 opacity-80"
                          }`}
                        >
                          {val}
                          {metricMode === "attendance" ? "%" : ""}
                        </text>

                        {/* Bottom X-Axis Cohort Label */}
                        <text
                          x={centerBarX}
                          y={paddingTop + chartPlotHeight + 20}
                          textAnchor="middle"
                          className={`text-[10px] font-mono font-bold transition-all ${
                            isHovered ? "fill-[#7C248C] font-black" : "fill-slate-600"
                          }`}
                        >
                          {batch.name.length > 10 ? `${batch.name.slice(0, 9)}…` : batch.name}
                        </text>
                      </g>
                    );
                  })}

                {/* MODE B: CURVE LINE & AREA TREND */}
                {chartType === "trend" && (
                  <g>
                    {/* Shaded Area Under Line */}
                    {areaPathD && (
                      <path d={areaPathD} fill="url(#trendAreaGrad)" className="transition-all duration-500" />
                    )}

                    {/* Smooth Stroke Line */}
                    {linePathD && (
                      <path
                        d={linePathD}
                        fill="none"
                        stroke="#7C248C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="transition-all duration-500"
                      />
                    )}

                    {/* Data Points on Line */}
                    {points.map((p, idx) => {
                      const isHovered = activeSegmentIndex === idx;
                      const color = palette[idx % palette.length];

                      return (
                        <g
                          key={idx}
                          onMouseEnter={() => setActiveSegmentIndex(idx)}
                          onMouseLeave={() => setActiveSegmentIndex(null)}
                          className="cursor-pointer"
                        >
                          {/* Outer pulse circle when hovered */}
                          {isHovered && (
                            <circle cx={p.x} cy={p.y} r="12" fill={color.fill} fillOpacity="0.2" />
                          )}
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? "6" : "4.5"}
                            fill="#FFFFFF"
                            stroke={color.fill}
                            strokeWidth="3"
                            className="transition-all duration-200"
                          />

                          {/* Data Value */}
                          <text
                            x={p.x}
                            y={p.y - 12}
                            textAnchor="middle"
                            className="text-[10px] font-mono font-black fill-slate-900"
                          >
                            {p.val}
                            {metricMode === "attendance" ? "%" : ""}
                          </text>

                          {/* Bottom X-Axis Cohort Label */}
                          <text
                            x={p.x}
                            y={paddingTop + chartPlotHeight + 20}
                            textAnchor="middle"
                            className={`text-[10px] font-mono font-bold transition-all ${
                              isHovered ? "fill-[#7C248C] font-black" : "fill-slate-600"
                            }`}
                          >
                            {p.batch.name.length > 10 ? `${p.batch.name.slice(0, 9)}…` : p.batch.name}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                )}
              </svg>
            ) : (
              <div className="p-12 text-center text-xs text-slate-400 font-mono">
                No active cohorts available for graphical representation.
              </div>
            )}
          </div>

          {/* Analytical Footprint Summary Cards */}
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-[#7C248C] block">Eval Velocity</span>
              <strong className="text-sm font-black text-slate-900 font-mono">{assignmentEvalRate}%</strong>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-[#1E2B88] block">Pass Rate</span>
              <strong className="text-sm font-black text-slate-900 font-mono">{quizPassRate}%</strong>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-emerald-800 block">Attendance</span>
              <strong className="text-sm font-black text-slate-900 font-mono">{avgAttendanceRate}%</strong>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Donut Ratio Breakdown */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 via-white to-purple-50/30 p-6 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-between gap-6 shadow-2xs">
          <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-black text-slate-900 uppercase tracking-wider font-mono">
              {metricMode.toUpperCase()} Share
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Ratio Distribution
            </span>
          </div>

          {/* Render Vector Donut Chart */}
          <div className="relative flex items-center justify-center">
            <svg width="180" height="180" viewBox="0 0 180 180" className="transform -rotate-90">
              <circle
                cx={donutCenter}
                cy={donutCenter}
                r={donutRadius}
                fill="transparent"
                stroke="#E2E8F0"
                strokeWidth={strokeWidth}
              />
              {donutSlices.map((slice, i) => (
                <circle
                  key={i}
                  cx={donutCenter}
                  cy={donutCenter}
                  r={donutRadius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={strokeWidth}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  className="transition-all duration-700 ease-out cursor-pointer hover:opacity-85"
                  onMouseEnter={() => setActiveSegmentIndex(i)}
                  onMouseLeave={() => setActiveSegmentIndex(null)}
                />
              ))}
            </svg>

            {/* Inner Center Metric Tag */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
              <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                {metricMode}
              </span>
              <span className="text-xl font-black text-slate-900 font-mono tracking-tight">
                {metricMode === "learners" && totalStudents}
                {metricMode === "sessions" && totalClasses}
                {metricMode === "attendance" && `${avgAttendanceRate}%`}
              </span>
              <span className="text-[9px] text-slate-500 font-medium">Recorded</span>
            </div>
          </div>

          {/* Interactive Segment Legend */}
          <div className="w-full space-y-1.5 pt-2">
            {donutSlices.map((slice, i) => (
              <div
                key={i}
                onMouseEnter={() => setActiveSegmentIndex(i)}
                onMouseLeave={() => setActiveSegmentIndex(null)}
                className={`flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                  activeSegmentIndex === i ? "bg-white shadow-2xs font-bold" : "text-slate-600"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: slice.color }} />
                  <span className="truncate">{slice.label}</span>
                </div>
                <div className="font-mono font-extrabold text-slate-900 shrink-0">
                  {slice.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
