import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const App = lazy(() => import("./App"));

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
    </div>
  );
}

export function DeluxRoot() {
  return (
    <ClientOnly fallback={<Spinner />}>
      <Suspense fallback={<Spinner />}>
        <App />
      </Suspense>
    </ClientOnly>
  );
}
