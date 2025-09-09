function formatDuration(ms) {
  const totalMinutes  = Math.max(0, Math.floor(ms / 60000));
  const days          = Math.floor(totalMinutes / (60 * 24));
  const hours         = Math.floor((totalMinutes % (60 * 24)) / 60);
  const mins          = totalMinutes % 60;

  if (days > 0)       return `${days}d ${hours}h ${mins}m`;
  if (hours > 0)      return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function createdAtFromCardId(cardId) {
  const ts = parseInt(cardId.substring(0, 8), 16);
  return new Date(ts * 1000);
}

function makeBadge(sinceDate) {
  const now         = Date.now();
  const diff        = now - sinceDate.getTime();
  const label       = `⏱ ${formatDuration(diff)}`;
  return { text: label, color: "blue", tooltip: `Criado em ${sinceDate.toLocaleString()}`, refresh: 60 };
}

TrelloPowerUp.initialize({
  'card-badges': async function (t, _opts) {
    const card          = await t.card('id');
    const createdAt     = createdAtFromCardId(card.id);
    return [ makeBadge(createdAt) ];
  },

  'card-detail-badges': async function (t, _opts) {
    const card            = await t.card('id');
    const createdAt       = createdAtFromCardId(card.id);
    return [ makeBadge(createdAt) ];
  }
});