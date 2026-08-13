import { createFileRoute } from "@tanstack/react-router";
import { NotFoundPage } from "@/components/NotFoundPage";

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Page Not Found — purelearn.ai" },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: NotFoundPage,
});
