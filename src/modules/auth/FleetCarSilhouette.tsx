import React from 'react';

/**
 * 入口页 Hero 车辆轮廓插画，对齐续租参考实现的流线型车身光轨。
 * 颜色全部引用 customer token；按设计基线 §11 不做装饰性循环动画。
 */
export function FleetCarSilhouette({ className = '' }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`relative flex items-center justify-center overflow-visible select-none ${className}`}>
      <svg viewBox="0 0 280 76" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full overflow-visible">
        <defs>
          {/* 车身品牌橙渐变 */}
          <linearGradient id="fleetCarBodyGrad" x1="20" y1="36" x2="250" y2="36" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--customer-color-orange-200)" />
            <stop offset="35%" stopColor="var(--customer-color-orange-500)" />
            <stop offset="100%" stopColor="var(--customer-color-orange-600)" />
          </linearGradient>
          {/* 前大灯光束扩散渐变 */}
          <linearGradient id="fleetHeadlightGrad" x1="240" y1="46" x2="278" y2="46" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--customer-color-orange-500)" stopOpacity="0.65" />
            <stop offset="45%" stopColor="var(--customer-color-orange-200)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--customer-color-orange-200)" stopOpacity="0" />
          </linearGradient>
          {/* 尾灯拖尾渐变 */}
          <linearGradient id="fleetTailLightGrad" x1="42" y1="45" x2="14" y2="45" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--customer-color-orange-700)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--customer-color-orange-700)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 地面车道与速度虚线 */}
        <path d="M 10 58 L 270 58" stroke="var(--customer-color-slate-200)" strokeWidth="1.5" />
        <path
          d="M 20 58 L 260 58"
          stroke="var(--customer-color-orange-200)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray="6 12"
        />

        {/* 抽象车身流线 */}
        <path
          d="M 40 45 C 50 35, 75 22, 115 17 C 155 12, 192 18, 222 35 C 232 40, 238 43, 246 45"
          stroke="url(#fleetCarBodyGrad)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* 车窗流线分隔 */}
        <path
          d="M 98 25 C 130 19, 168 20, 198 32"
          stroke="var(--customer-color-slate-300)"
          strokeOpacity="0.7"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* 车身腰线与裙边 */}
        <path
          d="M 36 47 C 60 48, 80 43, 100 48 C 150 49, 190 44, 248 46"
          stroke="var(--customer-color-orange-500)"
          strokeOpacity="0.35"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        {/* 前后抽象轮拱与光轮 */}
        <path
          d="M 62 58 C 64 50, 78 50, 80 58"
          stroke="var(--customer-color-orange-600)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="71" cy="58" r="2.5" fill="var(--customer-color-orange-600)" />

        <path
          d="M 200 58 C 202 50, 216 50, 218 58"
          stroke="var(--customer-color-orange-500)"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="209" cy="58" r="2.5" fill="var(--customer-color-orange-500)" />

        {/* 前大灯光束 */}
        <polygon points="246,44 278,38 278,54 246,47" fill="url(#fleetHeadlightGrad)" />
        <circle cx="246" cy="45.5" r="2" fill="var(--customer-color-orange-500)" />

        {/* 尾灯拖尾光轨 */}
        <line
          x1="40"
          y1="45"
          x2="16"
          y2="45"
          stroke="url(#fleetTailLightGrad)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="40" cy="45" r="1.5" fill="var(--customer-color-orange-700)" />
      </svg>
    </div>
  );
}
