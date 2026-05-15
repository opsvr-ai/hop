import { ShieldCheck } from "lucide-react";

export default function ApprovalsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">审批队列</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理危险命令审批请求与豁免清单
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60">功能开发中</p>
      </div>
    </div>
  );
}
