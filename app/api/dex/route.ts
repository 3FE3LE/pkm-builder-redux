import { NextResponse } from "next/server";

import {
  getLocalAbilityIndex,
  getLocalItemIndex,
  getLocalMoveIndex,
  getLocalPokemonIndex,
  getLocalSpeciesList,
} from "@/lib/localDex";

export const runtime = "nodejs";

function normalize(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/['’.:]/g, "")
    .replace(/\s+/g, "-");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pokemon = searchParams.get("pokemon");
  const move = searchParams.get("move");
  const item = searchParams.get("item");
  const ability = searchParams.get("ability");
  const speciesList = searchParams.get("speciesList");

  if (speciesList) {
    return NextResponse.json(getLocalSpeciesList());
  }

  if (!pokemon && !move && !item && !ability) {
    return NextResponse.json({ error: "Missing pokemon, move, item or ability query parameter." }, { status: 400 });
  }

  if (pokemon) {
    const pokemonIndex = getLocalPokemonIndex() as Record<string, any>;
    const moveIndex = getLocalMoveIndex() as Record<string, any>;
    const entry = pokemonIndex[normalize(pokemon)];
    if (!entry) {
      return NextResponse.json({ error: `Pokemon not found: ${pokemon}` }, { status: 404 });
    }
    return NextResponse.json({
      kind: "pokemon",
      ...entry,
      learnsets: {
        levelUp: entry.learnsets.levelUp.map((item: any) => ({
          ...item,
          details: moveIndex[normalize(item.move)] ?? null,
        })),
        machines: entry.learnsets.machines.map((item: any) => ({
          ...item,
          details: moveIndex[normalize(item.move)] ?? null,
        })),
      },
    });
  }

  const moveIndex = getLocalMoveIndex() as Record<string, any>;
  if (move) {
    const entry = moveIndex[normalize(move)];
    if (!entry) {
      return NextResponse.json({ error: `Move not found: ${move}` }, { status: 404 });
    }
    return NextResponse.json({
      kind: "move",
      ...entry,
    });
  }

  if (item) {
    const itemIndex = getLocalItemIndex() as Record<string, any>;
    const entry = itemIndex[normalize(item)];
    if (!entry) {
      return NextResponse.json({ error: `Item not found: ${item}` }, { status: 404 });
    }
    return NextResponse.json({
      kind: "item",
      ...entry,
    });
  }

  const abilityIndex = getLocalAbilityIndex() as Record<string, any>;
  const entry = abilityIndex[normalize(ability!)];
  if (!entry) {
    return NextResponse.json({ error: `Ability not found: ${ability}` }, { status: 404 });
  }
  return NextResponse.json({
    kind: "ability",
    ...entry,
  });
}
