import { Puzzle } from "lucide-react";

export default function PluginsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="glass-panel rounded-2xl p-12 text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mx-auto">
          <Puzzle className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-foreground">插件管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            管理已安装插件，启用/禁用功能模块
          </p>
        </div>
        <p className="text-xs text-muted-foreground/60">14 个插件 · 功能开发中</p>
      </div>
    </div>
  );
}
