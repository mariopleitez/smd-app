const normalizeFoodText = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const foodEmojiRules = [
  { pattern: /\b(tomate|jitomate)\b/, emoji: '🍅' },
  { pattern: /\b(cebolla)\b/, emoji: '🧅' },
  { pattern: /\b(ajo)\b/, emoji: '🧄' },
  { pattern: /\b(papa|patata)\b/, emoji: '🥔' },
  { pattern: /\b(zanahoria)\b/, emoji: '🥕' },
  { pattern: /\b(lechuga)\b/, emoji: '🥬' },
  { pattern: /\b(brocoli)\b/, emoji: '🥦' },
  { pattern: /\b(pepino)\b/, emoji: '🥒' },
  { pattern: /\b(pimiento|chile)\b/, emoji: '🫑' },
  { pattern: /\b(aguacate)\b/, emoji: '🥑' },
  { pattern: /\b(limon|lima)\b/, emoji: '🍋' },
  { pattern: /\b(manzana)\b/, emoji: '🍎' },
  { pattern: /\b(platano|banano|banana)\b/, emoji: '🍌' },
  { pattern: /\b(fresa)\b/, emoji: '🍓' },
  { pattern: /\b(uva)\b/, emoji: '🍇' },
  { pattern: /\b(leche)\b/, emoji: '🥛' },
  { pattern: /\b(queso)\b/, emoji: '🧀' },
  { pattern: /\b(yogur|yogurt)\b/, emoji: '🍶' },
  { pattern: /\b(huevo)\b/, emoji: '🥚' },
  { pattern: /\b(pan)\b/, emoji: '🍞' },
  { pattern: /\b(arroz)\b/, emoji: '🍚' },
  { pattern: /\b(pasta|spaghetti|macarron)\b/, emoji: '🍝' },
  { pattern: /\b(sal)\b/, emoji: '🧂' },
  { pattern: /\b(azucar)\b/, emoji: '🍬' },
  { pattern: /\b(aceite)\b/, emoji: '🫒' },
  { pattern: /\b(pollo)\b/, emoji: '🍗' },
  { pattern: /\b(res|carne)\b/, emoji: '🥩' },
  { pattern: /\b(pescado|salmon)\b/, emoji: '🐟' },
  { pattern: /\b(camaron)\b/, emoji: '🍤' },
  { pattern: /\b(agua)\b/, emoji: '💧' },
  { pattern: /\b(cafe)\b/, emoji: '☕' },
  { pattern: /\b(jugo)\b/, emoji: '🧃' },
  { pattern: /\b(cereal)\b/, emoji: '🥣' },
];

export const getFoodEmoji = (label, fallbackEmoji = '🛒') => {
  const normalizedLabel = normalizeFoodText(label);
  const matchingRule = foodEmojiRules.find((rule) => rule.pattern.test(normalizedLabel));
  return matchingRule?.emoji || fallbackEmoji;
};

