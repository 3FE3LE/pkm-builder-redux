"use client";

export function MoveHighlightsPanel({
  moveHighlights,
}: {
  moveHighlights: { move: string; changes: string[] }[];
}) {
  return (
    <div className="px-1 py-1">
      <p className="display-face text-sm text-accent">Cambios de moves relevantes</p>
      <div className="scrollbar-thin mt-3 max-h-[24rem] space-y-2 overflow-auto">
        {moveHighlights.map((move) => (
          <article key={move.move} className="px-1 py-1">
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
