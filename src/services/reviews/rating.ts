// Half-star <-> stored rating. The DB stores 1..10 (each unit = half a star);
// the UI works in 0.5..5 stars.
export function starsToRating(stars: number): number {
  return Math.round(stars * 2);
}

export function ratingToStars(rating: number): number {
  return rating / 2;
}
