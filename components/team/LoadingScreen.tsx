"use client";

export function LoadingScreen() {
  return (
    <main className="relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl">
        <div className="panel-strong rounded-[1rem] p-8">
          <p className="display-face text-sm text-accent">Cargando builder</p>
          <p className="mt-3 text-sm text-muted">
            Rehidratando el estado persistido del equipo, checkpoint y flags del run.
          </p>
        </div>
      </section>
    </main>
  );
}
