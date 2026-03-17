#!/usr/bin/env node

// OpenTabletop Sample Data Loader
// Reads YAML sample data from data/samples/ and loads into PostgreSQL.
// Usage:
//   node scripts/load-samples.js --connection "postgresql://localhost/opentabletop"
//   node scripts/load-samples.js --dry-run    # Print SQL without executing

import { readFileSync, readdirSync, existsSync } from "fs";
import { join, basename } from "path";
import { parse } from "yaml";

const SAMPLES_DIR = join(import.meta.dirname, "..", "data", "samples");
const TAXONOMY_DIR = join(import.meta.dirname, "..", "data", "taxonomy");

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const connIdx = args.indexOf("--connection");
const connString = connIdx !== -1 ? args[connIdx + 1] : null;

if (!dryRun && !connString) {
  console.error(
    "Usage: node scripts/load-samples.js --connection <pg-url> [--dry-run]"
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadYaml(filePath) {
  if (!existsSync(filePath)) return null;
  return parse(readFileSync(filePath, "utf8"));
}

function esc(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (Array.isArray(val)) {
    if (val.length === 0) return "'{}'";
    return `ARRAY[${val.map((v) => esc(v)).join(", ")}]`;
  }
  if (typeof val === "object") return esc(JSON.stringify(val));
  return `'${String(val).replace(/'/g, "''")}'`;
}

function insertSql(table, row) {
  const cols = Object.keys(row);
  const vals = cols.map((c) => esc(row[c]));
  return `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")}) ON CONFLICT DO NOTHING;`;
}

const statements = [];
function emit(sql) {
  statements.push(sql);
}

// ---------------------------------------------------------------------------
// Load taxonomy vocabularies
// ---------------------------------------------------------------------------

function loadTaxonomy() {
  for (const [file, table] of [
    ["mechanics.yaml", "mechanics"],
    ["categories.yaml", "categories"],
    ["themes.yaml", "themes"],
  ]) {
    const data = loadYaml(join(TAXONOMY_DIR, file));
    if (!data) continue;

    // Taxonomy files have a top-level array or a keyed structure
    const items = Array.isArray(data) ? data : data.items || [];
    for (const item of items) {
      if (!item.slug) continue;
      emit(
        insertSql(table, {
          id: item.id || crypto.randomUUID(),
          slug: item.slug,
          name: item.name,
          description: item.definition || item.description || null,
        })
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Load sample game data
// ---------------------------------------------------------------------------

function loadGameDir(dirPath) {
  const dirName = basename(dirPath);
  console.error(`Loading sample: ${dirName}`);

  // game.yaml → games table
  const game = loadYaml(join(dirPath, "game.yaml"));
  if (!game) return;

  emit(
    insertSql("games", {
      id: game.id,
      slug: game.slug,
      name: game.name,
      sort_name: game.sort_name || null,
      type: game.type,
      parent_game_id: game.parent_game_id || null,
      year_published: game.year_published || null,
      description: game.description || null,
      description_short: game.description_short || null,
      min_players: game.min_players || null,
      max_players: game.max_players || null,
      min_playtime_minutes: game.min_playtime_minutes || null,
      max_playtime_minutes: game.max_playtime_minutes || null,
      community_playtime_min_minutes:
        game.community_playtime_min_minutes || null,
      community_playtime_max_minutes:
        game.community_playtime_max_minutes || null,
      community_playtime_median_minutes:
        game.community_playtime_median_minutes || null,
      min_age: game.min_age || null,
      community_suggested_age: game.community_suggested_age || null,
      average_rating: game.average_rating || null,
      bayes_rating: game.bayes_rating || null,
      rating_count: game.rating_count || null,
      rating_stddev: game.rating_stddev || null,
      rating_confidence: game.rating_confidence || null,
      rating_distribution: game.rating_distribution || null,
      weight: game.weight || null,
      weight_votes: game.weight_votes || null,
      rank_overall: game.rank_overall || null,
      owner_count: game.owner_count || null,
      wishlist_count: game.wishlist_count || null,
      total_plays: game.total_plays || null,
      mode: game.mode || null,
      funding_source: game.funding_source || null,
      language_dependence: game.language_dependence || null,
      bgg_id: game.identifiers?.find((i) => i.source === "bgg")?.external_id
        ? parseInt(
            game.identifiers.find((i) => i.source === "bgg").external_id
          )
        : null,
      status: game.status || "active",
    })
  );

  // Taxonomy junction tables
  if (game.mechanics) {
    for (const slug of game.mechanics) {
      emit(
        `INSERT INTO game_mechanics (game_id, mechanic_id) SELECT ${esc(game.id)}, id FROM mechanics WHERE slug = ${esc(slug)} ON CONFLICT DO NOTHING;`
      );
    }
  }
  if (game.categories) {
    for (const slug of game.categories) {
      emit(
        `INSERT INTO game_categories (game_id, category_id) SELECT ${esc(game.id)}, id FROM categories WHERE slug = ${esc(slug)} ON CONFLICT DO NOTHING;`
      );
    }
  }
  if (game.themes) {
    for (const slug of game.themes) {
      emit(
        `INSERT INTO game_themes (game_id, theme_id) SELECT ${esc(game.id)}, id FROM themes WHERE slug = ${esc(slug)} ON CONFLICT DO NOTHING;`
      );
    }
  }

  // External identifiers
  if (game.identifiers) {
    for (const ident of game.identifiers) {
      emit(
        insertSql("external_identifiers", {
          game_id: game.id,
          source: ident.source,
          external_id: ident.external_id,
        })
      );
    }
  }

  // expansions.yaml → games table (expansion entities)
  const expansions = loadYaml(join(dirPath, "expansions.yaml"));
  if (Array.isArray(expansions)) {
    for (const exp of expansions) {
      emit(
        insertSql("games", {
          id: exp.id,
          slug: exp.slug,
          name: exp.name,
          type: exp.type,
          parent_game_id: exp.parent_game_id || game.id,
          year_published: exp.year_published || null,
          description_short: exp.description_short || null,
          min_players: exp.min_players || null,
          max_players: exp.max_players || null,
          weight: exp.weight || null,
          average_rating: exp.average_rating || null,
          rating_count: exp.rating_count || null,
          status: "active",
        })
      );

      // Relationship: expansion → base game
      emit(
        insertSql("game_relationships", {
          source_game_id: exp.id,
          target_game_id: game.id,
          relationship_type:
            exp.type === "standalone_expansion"
              ? "integrates_with"
              : "expands",
          ordinal: 0,
        })
      );
    }
  }

  // player-count-ratings.yaml → player_count_ratings table
  const pcr = loadYaml(join(dirPath, "player-count-ratings.yaml"));
  if (pcr?.ratings) {
    for (const r of pcr.ratings) {
      emit(
        insertSql("player_count_ratings", {
          game_id: pcr.game_id || game.id,
          player_count: r.player_count,
          average_rating: r.average_rating,
          rating_count: r.rating_count,
          rating_stddev: r.rating_stddev || null,
        })
      );
    }
  }

  // experience-playtime.yaml → experience_playtime + profiles
  const ept = loadYaml(join(dirPath, "experience-playtime.yaml"));
  if (ept?.levels) {
    for (const level of ept.levels) {
      emit(
        insertSql("experience_playtime", {
          game_id: ept.game_id || game.id,
          experience_level: level.experience_level,
          median_minutes: level.median_minutes,
          p10_minutes: level.p10_minutes || null,
          p90_minutes: level.p90_minutes || null,
          report_count: level.report_count,
        })
      );
    }
    if (ept.multipliers) {
      emit(
        insertSql("experience_playtime_profiles", {
          game_id: ept.game_id || game.id,
          sufficient_data: ept.sufficient_data || false,
          multiplier_first_play: ept.multipliers.first_play || null,
          multiplier_learning: ept.multipliers.learning || null,
          multiplier_experienced: ept.multipliers.experienced || 1.0,
          multiplier_expert: ept.multipliers.expert || null,
        })
      );
    }
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.error("OpenTabletop Sample Data Loader");
console.error(`Samples: ${SAMPLES_DIR}`);
console.error(`Mode: ${dryRun ? "dry-run (SQL to stdout)" : "execute"}`);
console.error("");

loadTaxonomy();

// Walk data/samples/ for game directories
for (const entry of readdirSync(SAMPLES_DIR, { withFileTypes: true })) {
  if (entry.isDirectory()) {
    loadGameDir(join(SAMPLES_DIR, entry.name));
  }
}

console.error(`\nGenerated ${statements.length} SQL statements.`);

if (dryRun) {
  console.log(statements.join("\n"));
} else {
  // Dynamic import pg only when actually connecting
  const { default: pg } = await import("pg");
  const client = new pg.Client({ connectionString: connString });
  await client.connect();
  try {
    await client.query("BEGIN");
    for (const sql of statements) {
      await client.query(sql);
    }
    await client.query("COMMIT");
    console.error("Data loaded successfully.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error loading data:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}
