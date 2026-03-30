import { Construction } from "lucide-react";

type Props = { title: string; description?: string };

export default function PlaceholderPage({ title, description }: Props) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Construction className="w-8 h-8 text-primary" />
      </div>
      <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-sm text-muted-foreground max-w-sm">
        {description ??
          "This module is under active development and will be available soon."}
      </p>
    </div>
  );
}
