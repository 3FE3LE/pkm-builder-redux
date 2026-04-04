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
  const movesList = searchParams.get("movesList");
  const abilitiesList = searchParams.get("abilitiesList");
  const itemsList = searchParams.get("itemsList");

  if (speciesList) {
    return NextResponse.json(getLocalSpeciesList());
  }

  if (movesList) {
    const moveIndex = getLocalMoveIndex() as Record<string, any>;
    const pokemonIndex = getLocalPokemonIndex() as Record<string, any>;
    const ownersByMove = new Map<string, { levelUp: string[]; machines: string[] }>();

    Object.values(pokemonIndex).forEach((pokemon: any) => {
      const seenLevelUp = new Set<string>();
      const seenMachines = new Set<string>();

      (pokemon.learnsets?.levelUp ?? []).forEach((entry: any) => {
        const key = normalize(entry.move);
        if (!key || seenLevelUp.has(key)) {
          return;
        }
        seenLevelUp.add(key);
        const current = ownersByMove.get(key) ?? { levelUp: [], machines: [] };
        ownersByMove.set(key, {
          ...current,
          levelUp: [...current.levelUp, pokemon.name],
        });
      });

      (pokemon.learnsets?.machines ?? []).forEach((entry: any) => {
        const key = normalize(entry.move);
        if (!key || seenMachines.has(key)) {
          return;
        }
        seenMachines.add(key);
        const current = ownersByMove.get(key) ?? { levelUp: [], machines: [] };
        ownersByMove.set(key, {
          ...current,
          machines: [...current.machines, pokemon.name],
        });
      });
    });

    return NextResponse.json({
      entries: Object.values(moveIndex).sort((left: any, right: any) => left.name.localeCompare(right.name)),
      ownersByMove: Object.fromEntries(
        Array.from(ownersByMove.entries()).map(([key, value]) => [
          key,
          {
            levelUp: Array.from(new Set(value.levelUp)).sort((left, right) => left.localeCompare(right)),
            machines: Array.from(new Set(value.machines)).sort((left, right) => left.localeCompare(right)),
          },
        ]),
      ),
    });
  }

  if (abilitiesList) {
    const abilityIndex = getLocalAbilityIndex() as Record<string, any>;
    const pokemonIndex = getLocalPokemonIndex() as Record<string, any>;
    const ownersByAbility = new Map<string, { regular: string[]; hidden: string[] }>();

    Object.values(pokemonIndex).forEach((pokemon: any) => {
      (pokemon.abilities ?? []).forEach((ability: string, index: number, abilities: string[]) => {
        const key = normalize(ability);
        if (!key) {
          return;
        }
        const current = ownersByAbility.get(key) ?? { regular: [], hidden: [] };
        const isHidden = abilities.length >= 3 && index >= 2;
        ownersByAbility.set(key, {
          regular: isHidden ? current.regular : [...current.regular, pokemon.name],
          hidden: isHidden ? [...current.hidden, pokemon.name] : current.hidden,
        });
      });
    });

    return NextResponse.json({
      entries: Object.values(abilityIndex).sort((left: any, right: any) => left.name.localeCompare(right.name)),
      ownersByAbility: Object.fromEntries(
        Array.from(ownersByAbility.entries()).map(([key, value]) => [
          key,
          {
            regular: Array.from(new Set(value.regular)).sort((left, right) => left.localeCompare(right)),
            hidden: Array.from(new Set(value.hidden)).sort((left, right) => left.localeCompare(right)),
          },
        ]),
      ),
    });
  }

  if (itemsList) {
    const itemIndex = getLocalItemIndex() as Record<string, any>;
    return NextResponse.json({
      entries: Object.values(itemIndex).sort((left: any, right: any) => left.name.localeCompare(right.name)),
    });
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
