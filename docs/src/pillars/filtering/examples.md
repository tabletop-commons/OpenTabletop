# Real-World Examples

Five scenarios demonstrating the filtering system in practice. Each includes the natural-language question, the API request, and an annotated response.

## Example 1: Game Night — 4 Players, 90 Minutes, Medium Weight

**Scenario:** Four friends have 90 minutes. They want medium-weight cooperative games, no space themes.

**Request:**

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "players": 4,
  "playtime_max": 90,
  "playtime_source": "community",
  "weight_min": 2.0,
  "weight_max": 3.5,
  "mechanics": ["cooperative"],
  "theme_not": ["space"],
  "sort": "rating_desc",
  "limit": 5
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "01967b3c-5a00-7000-8000-000000000010",
      "slug": "pandemic",
      "name": "Pandemic",
      "type": "base_game",
      "year_published": 2008,
      "min_players": 2,
      "max_players": 4,
      "community_max_playtime": 60,
      "weight": 2.42,
      "rating": 7.58
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000011",
      "slug": "the-crew-mission-deep-sea",
      "name": "The Crew: Mission Deep Sea",
      "type": "base_game",
      "year_published": 2021,
      "min_players": 2,
      "max_players": 5,
      "community_max_playtime": 25,
      "weight": 2.07,
      "rating": 8.06
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000012",
      "slug": "mysterium",
      "name": "Mysterium",
      "type": "base_game",
      "year_published": 2015,
      "min_players": 2,
      "max_players": 7,
      "community_max_playtime": 50,
      "weight": 1.91,
      "rating": 7.22
    }
  ],
  "meta": {
    "total": 87,
    "limit": 5,
    "cursor": "eyJyYXRpbmciOjcuMjIsImlkIjoiMDE5NjdiM2MifQ==",
    "filters_applied": {
      "players": 4,
      "playtime_max": 90,
      "playtime_source": "community",
      "weight_min": 2.0,
      "weight_max": 3.5,
      "mechanics": ["cooperative"],
      "theme_not": ["space"]
    }
  }
}
```

**Why this works:** Community play time is used (`playtime_source: "community"`), so games that publishers claim are "60 minutes" but actually take 110 are excluded. The space theme exclusion removes games like *Beyond the Sun* or *Xia* that might otherwise match mechanically.

---

## Example 2: Solo Gaming — Heavy, Engine-Building, Recent

**Scenario:** A solo player wants heavy engine-building games published in the last 3 years.

**Request:**

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "players": 1,
  "best_at": 1,
  "weight_min": 3.5,
  "mechanics_all": ["engine-building", "solo"],
  "year_min": 2023,
  "sort": "weight_desc",
  "limit": 10
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "01967b3c-5a00-7000-8000-000000000020",
      "slug": "ark-nova",
      "name": "Ark Nova",
      "type": "base_game",
      "year_published": 2023,
      "min_players": 1,
      "max_players": 4,
      "weight": 3.73,
      "rating": 8.52
    }
  ],
  "meta": {
    "total": 12,
    "limit": 10,
    "cursor": null,
    "filters_applied": {
      "players": 1,
      "best_at": 1,
      "weight_min": 3.5,
      "mechanics_all": ["engine-building", "solo"],
      "year_min": 2023
    }
  }
}
```

**Why `best_at` matters:** `players=1` finds games that *support* solo play, but many of those are mediocre solo experiences (a multiplayer game with a tacked-on solo mode). `best_at=1` narrows to games the community considers *best* solo, dramatically improving recommendation quality.

---

## Example 3: Large Group — Party Games for 6-8 People

**Scenario:** A group of 7 wants light party games under 30 minutes.

**Request:**

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "players": 7,
  "playtime_max": 30,
  "weight_max": 1.5,
  "category": ["party"],
  "sort": "rating_desc",
  "limit": 10
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "01967b3c-5a00-7000-8000-000000000030",
      "slug": "codenames",
      "name": "Codenames",
      "type": "base_game",
      "year_published": 2015,
      "min_players": 2,
      "max_players": 8,
      "max_playtime": 15,
      "weight": 1.31,
      "rating": 7.58
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000031",
      "slug": "wavelength",
      "name": "Wavelength",
      "type": "base_game",
      "year_published": 2019,
      "min_players": 2,
      "max_players": 12,
      "max_playtime": 30,
      "weight": 1.08,
      "rating": 7.42
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000032",
      "slug": "just-one",
      "name": "Just One",
      "type": "base_game",
      "year_published": 2018,
      "min_players": 3,
      "max_players": 7,
      "max_playtime": 20,
      "weight": 1.00,
      "rating": 7.54
    }
  ],
  "meta": {
    "total": 43,
    "limit": 10,
    "cursor": "eyJyYXRpbmciOjcuNTQsImlkIjoiMDE5NjdiM2MifQ=="
  }
}
```

---

## Example 4: Effective Mode — 6-Player Games with Expansions

**Scenario:** A group of 6 wants strategy games. They are willing to buy expansions if needed.

**Request:**

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "players": 6,
  "effective": true,
  "weight_min": 2.5,
  "weight_max": 4.0,
  "category": ["strategy"],
  "sort": "rating_desc",
  "limit": 5
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "01967b3c-5a00-7000-8000-000000000001",
      "slug": "spirit-island",
      "name": "Spirit Island",
      "type": "base_game",
      "year_published": 2017,
      "min_players": 1,
      "max_players": 4,
      "weight": 3.89,
      "rating": 8.31,
      "matched_via": {
        "type": "expansion_combination",
        "expansions": [
          { "slug": "jagged-earth", "name": "Jagged Earth" }
        ],
        "effective_properties": {
          "min_players": 1,
          "max_players": 6,
          "weight": 4.10
        },
        "resolution_tier": 1
      }
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000040",
      "slug": "scythe",
      "name": "Scythe",
      "type": "base_game",
      "year_published": 2016,
      "min_players": 1,
      "max_players": 5,
      "weight": 3.42,
      "rating": 8.22,
      "matched_via": {
        "type": "expansion_combination",
        "expansions": [
          { "slug": "scythe-invaders-from-afar", "name": "Scythe: Invaders from Afar" }
        ],
        "effective_properties": {
          "min_players": 1,
          "max_players": 7,
          "weight": 3.45
        },
        "resolution_tier": 1
      }
    }
  ],
  "meta": {
    "total": 28,
    "limit": 5,
    "cursor": "eyJyYXRpbmciOjguMjIsImlkIjoiMDE5NjdiM2MifQ=="
  }
}
```

**Key insight:** Neither Spirit Island (1-4p) nor Scythe (1-5p) supports 6 players in base form. Both appear because effective mode found expansion combinations that reach 6. The `matched_via` object tells the consumer exactly which expansions to buy.

---

## Example 5: Designer Deep Dive — All Uwe Rosenberg Games

**Scenario:** A fan wants to explore all medium-to-heavy Uwe Rosenberg games sorted by year.

**Request:**

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "designer": ["uwe-rosenberg"],
  "weight_min": 2.5,
  "type": ["base_game"],
  "sort": "year_desc",
  "limit": 20
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "01967b3c-5a00-7000-8000-000000000050",
      "slug": "a-feast-for-odin",
      "name": "A Feast for Odin",
      "type": "base_game",
      "year_published": 2016,
      "weight": 3.86,
      "rating": 8.16
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000051",
      "slug": "caverna",
      "name": "Caverna: The Cave Farmers",
      "type": "base_game",
      "year_published": 2013,
      "weight": 3.78,
      "rating": 7.90
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000052",
      "slug": "agricola",
      "name": "Agricola",
      "type": "base_game",
      "year_published": 2007,
      "weight": 3.64,
      "rating": 7.94
    }
  ],
  "meta": {
    "total": 14,
    "limit": 20,
    "cursor": null,
    "filters_applied": {
      "designer": ["uwe-rosenberg"],
      "weight_min": 2.5,
      "type": ["base_game"]
    }
  }
}
```

**Note:** `type: ["base_game"]` excludes Rosenberg's expansions and promos, focusing only on his standalone designs. Without this filter, results would include expansion entries for Agricola, Caverna, etc.

---

## Example 6: First-Time Play — "We Have 2 Hours and Nobody Knows the Game"

**Scenario:** A group of 3 wants to try a new cooperative game tonight. They have 2 hours. They have never played whatever game they pick, so the first-play time needs to fit within 2 hours.

**Request:**

```http
POST /games/search HTTP/1.1
Content-Type: application/json

{
  "players": 3,
  "playtime_max": 120,
  "playtime_source": "community",
  "playtime_experience": "first_play",
  "weight_min": 2.0,
  "weight_max": 3.5,
  "mechanics": ["cooperative"],
  "sort": "rating_desc",
  "limit": 5,
  "include": ["experience_playtime"]
}
```

**Response:**

```json
{
  "data": [
    {
      "id": "01967b3c-5a00-7000-8000-000000000010",
      "slug": "pandemic",
      "name": "Pandemic",
      "type": "base_game",
      "year_published": 2008,
      "min_players": 2,
      "max_players": 4,
      "community_max_playtime": 60,
      "weight": 2.42,
      "rating": 7.58,
      "experience_playtime": {
        "levels": [
          { "experience_level": "first_play", "median_minutes": 75, "total_reports": 891 },
          { "experience_level": "experienced", "median_minutes": 50, "total_reports": 2104 }
        ],
        "multipliers": { "first_play": 1.50, "learning": 1.20, "experienced": 1.0, "expert": 0.90 },
        "sufficient_data": true
      }
    },
    {
      "id": "01967b3c-5a00-7000-8000-000000000080",
      "slug": "horrified",
      "name": "Horrified",
      "type": "base_game",
      "year_published": 2019,
      "min_players": 1,
      "max_players": 5,
      "community_max_playtime": 55,
      "weight": 2.02,
      "rating": 7.32,
      "experience_playtime": {
        "levels": [
          { "experience_level": "first_play", "median_minutes": 65, "total_reports": 234 },
          { "experience_level": "experienced", "median_minutes": 45, "total_reports": 567 }
        ],
        "multipliers": { "first_play": 1.44, "learning": 1.15, "experienced": 1.0, "expert": 0.92 },
        "sufficient_data": true
      }
    }
  ],
  "meta": {
    "total": 34,
    "limit": 5,
    "cursor": "eyJyYXRpbmciOjcuMzIsImlkIjoiMDE5NjdiM2MifQ==",
    "filters_applied": {
      "players": 3,
      "playtime_max": "≤ 120 min (adjusted for first_play)",
      "playtime_source": "community",
      "weight": "2.0 – 3.5",
      "mechanics": ["cooperative"]
    }
  }
}
```

**Key insight:** Spirit Island is NOT in these results. Its community max playtime is 150 minutes, and adjusted for first play (× 1.57) that is 235 minutes — well over the 2-hour budget. Pandemic fits because its first-play adjusted time (60 × 1.50 = 90 min) is within 120. The `experience_playtime` include shows the consumer exactly what to expect: "Pandemic will take about 75 minutes for your first game."

**Without experience adjustment**, this query would have returned Spirit Island (community max 150 min > 120, still excluded) but would have included games whose experienced play time is 80 minutes but whose first play realistically takes 130+ minutes — setting up the group for a game that runs over their time budget.
