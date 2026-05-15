import { Search } from "lucide-react";

export default function DiagnosisPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
          <Search className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">故障定界</h1>
          <p className="text-sm text-muted-foreground mt-1">
            分析系统异常并定位故障边界
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60">功能开发中…</p>
      </div>
    </div>
  );
}
