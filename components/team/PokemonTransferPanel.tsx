"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildPokemonShareUrl, exportPokemonToHash, importPokemonFromHash } from "@/lib/pokemonTransfer";
import type { EditableMember } from "@/lib/builderStore";

export function PokemonTransferPanel({
  member,
  onImportToPc,
  className,
  showImport = true,
}: {
  member?: EditableMember;
  onImportToPc: (member: EditableMember) => boolean;
  className?: string;
  showImport?: boolean;
}) {
  const [importValue, setImportValue] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const exportHash = useMemo(() => (member ? exportPokemonToHash(member) : ""), [member]);
  const shareUrl = useMemo(() => (member ? buildPokemonShareUrl(member) : ""), [member]);

  async function copyText(value: string, successLabel: string, fallbackLabel: string) {
    if (!value) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      setStatus(successLabel);
      return;
    }

    setStatus(fallbackLabel);
  }

  async function sharePokemonLink() {
    if (!shareUrl) {
      return;
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: member?.nickname || member?.species || "Pokemon compartido",
          url: shareUrl,
        });
        setStatus("Link compartido.");
        return;
      } catch {
        // If the share sheet is cancelled or unavailable mid-flight, fall back to copy.
      }
    }

    await copyText(shareUrl, "Link copiado.", "Copia manualmente el link.");
  }

  function handleImport() {
    const result = importPokemonFromHash(importValue);
    if (!result.ok) {
      setStatus(result.error);
      return;
    }

    const saved = onImportToPc(result.member);
    setStatus(saved ? `${result.member.nickname || result.member.species} se guardó en PC.` : "No se pudo guardar el Pokémon importado.");
    if (saved) {
      setImportValue("");
      setImportOpen(false);
    }
  }

  return (
    <div className={className ?? "rounded-[0.9rem] border border-line bg-surface-3 p-3"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="display-face text-sm text-accent">Import / Export</p>
          <p className="mt-1 text-xs text-muted">
            Exporta un Pokémon portable o importa uno nuevo directo a la PC.
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            void copyText(exportHash, "Token copiado.", "Copia manualmente el token.")
          }
          disabled={!member}
          aria-label="Copiar token"
          title="Copiar token"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => void sharePokemonLink()}
          disabled={!member}
          aria-label="Compartir"
          title="Compartir"
        >
          <Share2 className="h-4 w-4" />
        </Button>
        {showImport ? (
          <Button
            type="button"
            variant={importOpen ? "default" : "ghost"}
            size="icon-sm"
            onClick={() => setImportOpen((current) => !current)}
            aria-label={importOpen ? "Cerrar import" : "Importar"}
            title={importOpen ? "Cerrar import" : "Importar"}
          >
            <Download className="h-4 w-4" />
          </Button>
        ) : null}
      </div>

      {showImport && importOpen ? (
        <div className="mt-3 space-y-2">
          <Input
            value={importValue}
            onChange={(event) => setImportValue(event.target.value)}
            placeholder="Pega el token o link del Pokémon"
            aria-label="Hash a importar"
          />
          <div className="flex justify-end">
            <Button type="button" onClick={handleImport}>
              Guardar en PC
            </Button>
          </div>
        </div>
      ) : null}

      {status ? <p className="mt-3 text-xs text-muted">{status}</p> : null}
    </div>
  );
}
