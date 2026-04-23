import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function ComingSoon({
  icon: Icon,
  title,
  description,
  features,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className="border-border/60">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 ring-1 ring-primary/30">
            <Icon className="size-6 text-primary" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
              <Badge variant="outline" className="text-[10px]">
                em breve
              </Badge>
            </div>
            <p className="max-w-md text-sm text-muted-foreground">
              {description}
            </p>
          </div>
          <ul className="mt-2 grid w-full gap-2 sm:grid-cols-2">
            {features.map((f, i) => (
              <li
                key={i}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-left text-xs text-muted-foreground"
              >
                <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                {f}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
