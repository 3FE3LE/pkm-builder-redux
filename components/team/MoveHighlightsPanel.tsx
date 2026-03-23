"use client";

export function MoveHighlightsPanel({
  moveHighlights,
}: {
  moveHighlights: { move: string; changes: string[] }[];
}) {
  return (
    <div className="rounded-[1rem] p-6">
      <p className="display-face text-sm text-accent">Cambios de moves relevantes</p>
      <div className="scrollbar-thin mt-4 max-h-[24rem] space-y-3 overflow-auto pr-1">
        {moveHighlights.map((move) => (
          <article key={move.move} className="rounded-[0.75rem] border border-line p-3">
            <p className="display-face text-sm">{move.move}</p>
            <div className="mt-2 space-y-1 text-sm text-muted">
              {move.changes.map((change) => (
                <p key={`${move.move}-${change}`}>{change}</p>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
