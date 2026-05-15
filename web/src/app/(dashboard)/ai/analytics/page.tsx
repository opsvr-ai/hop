"use client";

import { Activity, BarChart3, TrendingUp } from "lucide-react";

export default function AnalyticsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Activity className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">使用分析</h1>
          <p className="text-xs text-muted-foreground">Token 用量与成本统计</p>
        </div>
      </div>
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground">分析功能开发中</h2>
          <p className="text-sm text-muted-foreground mt-1">
            将展示 Token 消耗趋势、成本分析、模型使用分布等图表
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/60">
          <TrendingUp className="h-3.5 w-3.5" />
          从会话历史中聚合数据
        </div>
      </div>
    </div>
  );
}
