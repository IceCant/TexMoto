export function slugify(value: string) {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug || "motorcycle";
}

export function createMotorcycleSlug(brand: string, model: string, year: number) {
  const suffix = crypto.randomUUID().replaceAll("-", "").slice(0, 6);
  return `${slugify(`${brand}-${model}-${year}`)}-${suffix}`;
}

