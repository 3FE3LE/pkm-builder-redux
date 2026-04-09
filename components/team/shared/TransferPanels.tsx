"use client";

import { useMemo, useState } from "react";
import { Copy, Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { buildPokemonShareUrl, exportPokemonToHash, importPokemonFromHash } from "@/lib/pokemonTransfer";
import type { EditableMember } from "@/lib/builderStore";

export function TransferActions({
  member,
  className,
}: {
  member?: EditableMember;
  className?: string;
}) {
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
        // Ignore share sheet cancellation and fall back to copy.
      }
    }

    await copyText(shareUrl, "Link copiado.", "Copia manualmente el link.");
  }

  return (
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      <div className="flex flex-wrap items-center gap-2">
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
      </div>
      {status ? <p className="text-xs text-muted">{status}</p> : null}
    </div>
  );
}

export function ImportPanel({
  onImportToPc,
  className,
}: {
  onImportToPc: (member: EditableMember) => boolean;
  className?: string;
}) {
  const [importValue, setImportValue] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

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
    <div className={className ?? "flex flex-wrap items-center gap-2"}>
      <div className="flex flex-wrap items-center gap-2">
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
      </div>

      {importOpen ? (
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <Input
            className="min-w-64 flex-1"
            value={importValue}
            onChange={(event) => setImportValue(event.target.value)}
            placeholder="Pega el token o link del Pokémon"
            aria-label="Hash a importar"
          />
          <Button type="button" onClick={handleImport}>
            Guardar en PC
          </Button>
        </div>
      ) : null}

      {status ? <p className="text-xs text-muted">{status}</p> : null}
    </div>
  );
}
