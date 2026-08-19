// Each category owns a three-colour quilt colorway. Order is [ground, A, B].
export const CATEGORIES = {
  nature:   { label: 'Nature',    colors: ['#E4E8DA', '#4F6B45', '#8FA36B'] },
  auto:     { label: 'Auto',      colors: ['#DFE0DC', '#3A4550', '#B5502F'] },
  sewing:   { label: 'Sewing',    colors: ['#EFE6DE', '#7B2D3B', '#C88A7A'] },
  knitting: { label: 'Knitting',  colors: ['#EAE6DC', '#4A6785', '#C9B27E'] },
  quilting: { label: 'Quilting',  colors: ['#F0EAD9', '#8C3B4A', '#C08A2E'] },
  baking:   { label: 'Baking',    colors: ['#F1E9D8', '#9A6524', '#D6B571'] },
  garden:   { label: 'Garden',    colors: ['#E6EADC', '#3F6144', '#C08A2E'] },
  books:    { label: 'Books',     colors: ['#E7E4DB', '#3B4A63', '#9C7B4E'] },
  music:    { label: 'Music',     colors: ['#EDE5DA', '#5B3A62', '#C08A2E'] },
  fishing:  { label: 'Fishing',   colors: ['#DFE7E6', '#2F5A63', '#9BB0A4'] },
}

export const CATEGORY_KEYS = Object.keys(CATEGORIES)

export const categoryLabel = (key) => CATEGORIES[key]?.label ?? key
export const categoryColors = (key) => CATEGORIES[key]?.colors ?? CATEGORIES.nature.colors
