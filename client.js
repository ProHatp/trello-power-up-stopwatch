const BOARD_KEY_ID            = 'timerTargetListId';
const BOARD_KEY_NAME          = 'timerTargetListName';
const CARD_KEY_ENTER          = 'timerEnteredAtMs';
const ICON_URL                = 'https://prohatp.github.io/trello-power-up-stopwatch/icon-timer.svg';

function nextMinuteRefreshSeconds(minFloor = 1, maxCeil = 60) {
  const now           = new Date();
  const secs          = 60 - now.getSeconds();
  return Math.max(minFloor, Math.min(maxCeil, secs));
}

function formatDuration(ms) {
  const totalMin      = Math.max(0, Math.floor(ms / 60000));
  const d             = Math.floor(totalMin / 1440);
  const h             = Math.floor((totalMin % 1440) / 60);
  const m             = totalMin % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function createdAtFromCardId(cardId) {
  const ts            = parseInt(cardId.substring(0, 8), 16);
  return new Date(ts * 1000);
}

function colorByHours(hours) {
  if (hours >= 72)    return 'red';
  if (hours >= 24)    return 'yellow';
  return 'blue';
}

function makeAgeBadge(dt, labelPrefix = '⏱') {
  const diff          = Date.now() - dt.getTime();
  const hours         = diff / 3600000;
  return {
    text: `${labelPrefix} ${formatDuration(diff)}`,
    color: colorByHours(hours),
    tooltip: `Desde ${dt.toLocaleString()}`,
    refresh: nextMinuteRefreshSeconds()
  };
}

async function openListPicker(t) {
  const lists         = await t.lists('id', 'name');
  const items         = lists.map(list => ({
    text: list.name,
    callback: async (t2) => {
      await t2.set('board', 'shared', BOARD_KEY_ID, list.id);
      await t2.set('board', 'shared', BOARD_KEY_NAME, list.name);
      return t2.closePopup();
    }
  }));

  items.push({ separator: true });
  items.push({
    text: 'Remover Configuração',
    callback: async (t2) => {
      await t2.remove('board', 'shared', BOARD_KEY_ID);
      await t2.remove('board', 'shared', BOARD_KEY_NAME);
      return t2.closePopup();
    }
  });

  return t.popup({
    title: 'Cronômetro: escolha a lista',
    items
  });
}

TrelloPowerUp.initialize({
  'board-buttons': async function(t) {
    const [listId, listName] = await Promise.all([
      t.get('board', 'shared', BOARD_KEY_ID),
      t.get('board', 'shared', BOARD_KEY_NAME)
    ]);
    const label = listId ? `Cronômetro: ${listName}` : 'Cronômetro: Definir Lista';
    return [{
      text: label,
      icon: ICON_URL,
      condition: 'always',
      callback: (t2) => openListPicker(t2)
    }];
  },

  'card-badges': async function(t) {
    const targetListId  = await t.get('board', 'shared', BOARD_KEY_ID);

    if (!targetListId) return [{ text: '⏱ Selecione a Lista', color: 'grey', refresh: 300 }];
    
    const card          = await t.card('id', 'idList');

    if (card.idList === targetListId) {
      let enteredAt = await t.get('card', 'shared', CARD_KEY_ENTER);
      if (!enteredAt) {
        enteredAt = Date.now();
        await t.set('card', 'shared', CARD_KEY_ENTER, enteredAt);
      }
      return [ makeAgeBadge(new Date(enteredAt), '⏱ ') ];
    } else {
      const prev          = await t.get('card', 'shared', CARD_KEY_ENTER);
      if (prev) await t.remove('card', 'shared', CARD_KEY_ENTER);
      return [];
    }
  },

  'card-detail-badges': async function(t) {
    const targetListId    = await t.get('board', 'shared', BOARD_KEY_ID);
    if (!targetListId) return [];

    const card = await t.card('id', 'idList');
    if (card.idList !== targetListId) return [];

    let enteredAt         = await t.get('card', 'shared', CARD_KEY_ENTER);
    if (!enteredAt) {
      enteredAt = Date.now();
      await t.set('card', 'shared', CARD_KEY_ENTER, enteredAt);
    }
    return [ makeAgeBadge(new Date(enteredAt), '⏱ Iniciou') ];
  }
});
