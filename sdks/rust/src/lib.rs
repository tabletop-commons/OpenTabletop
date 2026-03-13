// OpenTabletop Rust SDK
//
// Usage:
//   let client = opentabletop::Client::new("https://api.opentabletop.org");
//   let games = client.games().list().players(4).weight_max(3.5).send().await?;
//
// See: https://opentabletop.org/guides/getting-started

pub mod client;
pub mod models;
pub mod error;
