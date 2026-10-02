"use strict";

const TOTAL_PAIRS = 8;

const portraits = [];
for (let i = 0; i < TOTAL_PAIRS; i++) {
  const portrait = {
    id: i + 1,
    src: `assets/images/pic-${i + 1}.jpg`,
    name: `Портрет ${i + 1}`,
  };
  portraits.push(portrait);
}

const cards = [];
for (let k = 0; k < portraits.length; k++) {
  const firstCard = {
    cardId: `${portraits[k].id}-first`,
    pairId: portraits[k].id,
    src: portraits[k].src,
    name: portraits[k].name,
    isFlipped: false,
    isMatched: false,
  };

  const secondCard = {
    cardId: `${portraits[k].id}-second`,
    pairId: portraits[k].id,
    src: portraits[k].src,
    name: portraits[k].name,
    isFlipped: false,
    isMatched: false,
  };

  cards.push(firstCard, secondCard);
}

function shuffleCards(cardsArray) {
  for (let i = cardsArray.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));

    const currentCard = cardsArray[i];

    cardsArray[i] = cardsArray[randomIndex];
    cardsArray[randomIndex] = currentCard;
  }
}

shuffleCards(cards);

function createElement(tagName, className, text) {
  const element = document.createElement(tagName);

  if (className) {
    element.className = className;
  }

  if (text !== undefined) {
    element.textContent = text;
  }

  return element;
}

const app = createElement("div", "app");

const header = createElement("header", "header");
const brand = createElement("div", "brand", "Memory Game");
const headerActions = createElement("div", "header__actions");

const newGameButton = createElement(
  "button",
  "button button--primary",
  "Новая игра",
);

const leaderboardButton = createElement(
  "button",
  "button button--secondary",
  "Таблица лидеров",
);

newGameButton.type = "button";
leaderboardButton.type = "button";

headerActions.append(newGameButton, leaderboardButton);
header.append(brand, headerActions);

const main = createElement("main", "main");

const gameInfo = createElement("section", "game-info");

const gameTitle = createElement(
  "h1",
  "game-info__title",
  "Найди одинаковые портреты",
);

const gameDescription = createElement(
  "p",
  "game-info__description",
  "Открывай карточки по две и найди все восемь пар.",
);

const statistics = createElement("div", "statistics");

const movesStatistic = createElement("div", "statistic");
const movesValue = createElement("span", "statistic__value", "0");
const movesLabel = createElement("span", "statistic__label", "Ходов");

const pairsStatistic = createElement("div", "statistic");
const pairsValue = createElement(
  "span",
  "statistic__value",
  `0 / ${TOTAL_PAIRS}`,
);
const pairsLabel = createElement("span", "statistic__label", "Пар найдено");

movesStatistic.append(movesValue, movesLabel);
pairsStatistic.append(pairsValue, pairsLabel);

statistics.append(movesStatistic, pairsStatistic);

gameInfo.append(gameTitle, gameDescription, statistics);

const gameBoard = createElement("section", "game-board");

gameBoard.setAttribute("aria-label", "Игровое поле");

main.append(gameInfo, gameBoard);
app.append(header, main);

document.body.append(app);

let firstSelectedCard = null;
let secondSelectedCard = null;

let moves = 0;
let matchedPairs = 0;

let isBoardLocked = false;
let isGameComplete = false;
let closeCardsTimer = null;

const STORAGE_KEY = "memoryGameResults";

function getSavedResults() {
  const savedResults = localStorage.getItem(STORAGE_KEY);

  if (savedResults === null) {
    return [];
  }

  try {
    const results = JSON.parse(savedResults);

    if (Array.isArray(results)) {
      return results;
    }

    return [];
  } catch (error) {
    return [];
  }
}

function saveGameResult(movesCount) {
  const results = getSavedResults();

  const newResult = {
    moves: movesCount,
    date: new Date().toISOString(),
  };

  results.push(newResult);

  results.sort((firstResult, secondResult) => {
    if (firstResult.moves !== secondResult.moves) {
      return firstResult.moves - secondResult.moves;
    }

    return new Date(firstResult.date) - new Date(secondResult.date);
  });

  const bestResults = results.slice(0, 10);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(bestResults));
}

function formatResultDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

function resetSelectedCards() {
  firstSelectedCard = null;
  secondSelectedCard = null;
}

function handleCardClick(cardElement, cardData) {
  if (
    isBoardLocked ||
    cardData.isFlipped ||
    cardData.isMatched ||
    isGameComplete
  ) {
    return;
  }

  cardData.isFlipped = true;

  cardElement.classList.add("is-flipped");
  cardElement.setAttribute("aria-label", cardData.name);

  const selectedCard = {
    element: cardElement,
    data: cardData,
  };

  if (firstSelectedCard === null) {
    firstSelectedCard = selectedCard;
    return;
  }

  secondSelectedCard = selectedCard;

  moves += 1;
  movesValue.textContent = moves;

  const isMatch =
    firstSelectedCard.data.pairId === secondSelectedCard.data.pairId;

  if (isMatch) {
    firstSelectedCard.data.isMatched = true;
    secondSelectedCard.data.isMatched = true;

    firstSelectedCard.element.classList.add("is-matched");
    secondSelectedCard.element.classList.add("is-matched");

    matchedPairs += 1;
    pairsValue.textContent = `${matchedPairs} / ${TOTAL_PAIRS}`;

    firstSelectedCard.element.setAttribute(
      "aria-label",
      `${firstSelectedCard.data.name}: пара найдена`,
    );
    secondSelectedCard.element.setAttribute(
      "aria-label",
      `${secondSelectedCard.data.name}: пара найдена`,
    );

    resetSelectedCards();

    if (matchedPairs === TOTAL_PAIRS) {
      finishGame();
    }

    return;
  }

  isBoardLocked = true;

  closeCardsTimer = setTimeout(() => {
    firstSelectedCard.data.isFlipped = false;
    secondSelectedCard.data.isFlipped = false;

    firstSelectedCard.element.classList.remove("is-flipped");
    secondSelectedCard.element.classList.remove("is-flipped");

    firstSelectedCard.element.setAttribute("aria-label", "Закрытая карточка");

    secondSelectedCard.element.setAttribute("aria-label", "Закрытая карточка");

    resetSelectedCards();

    isBoardLocked = false;
    closeCardsTimer = null;
  }, 1000);
}

function createCardElement(cardData) {
  const cardElement = createElement("button", "card");
  cardElement.type = "button";
  cardElement.dataset.cardId = cardData.cardId;
  cardElement.dataset.pairId = cardData.pairId;
  cardElement.setAttribute("aria-label", "Закрытая карточка");

  const cardInner = createElement("span", "card__inner");
  const cardBack = createElement("span", "card__face card__back", "?");
  const cardFront = createElement("span", "card__face card__front");
  const cardImage = createElement("img", "card__image");

  cardImage.src = cardData.src;
  cardImage.alt = "";
  cardImage.draggable = false;

  cardFront.append(cardImage);
  cardInner.append(cardBack, cardFront);
  cardElement.append(cardInner);

  cardElement.addEventListener("click", () => {
    handleCardClick(cardElement, cardData);
  });

  return cardElement;
}

function renderCards() {
  gameBoard.replaceChildren();

  for (const cardData of cards) {
    const cardElement = createCardElement(cardData);

    gameBoard.append(cardElement);
  }
}

renderCards();

const modal = createElement("dialog", "modal");
const modalPanel = createElement("div", "modal__panel");
const modalTitle = createElement("h2", "modal__title");
const modalContent = createElement("div", "modal__content");
const modalActions = createElement("div", "modal__actions");

modalPanel.append(modalTitle, modalContent, modalActions);
modal.append(modalPanel);

document.body.append(modal);

function openModal(title, content, actionButtons) {
  modalTitle.textContent = title;

  modalContent.replaceChildren();

  if (typeof content === "string") {
    const modalText = createElement("p", "modal__text", content);
    modalContent.append(modalText);
  } else {
    modalContent.append(content);
  }

  modalActions.replaceChildren(...actionButtons);

  document.body.classList.add("modal-open");
  modal.showModal();

  if (actionButtons.length > 0) {
    actionButtons[0].focus();
  }
}

function closeModal() {
  if (!modal.open) {
    return;
  }

  modal.close();
  document.body.classList.remove("modal-open");
}

modal.addEventListener("cancel", (event) => {
  event.preventDefault();
  closeModal();
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

function startNewGame() {
  if (closeCardsTimer !== null) {
    clearTimeout(closeCardsTimer);
    closeCardsTimer = null;
  }

  closeModal();

  moves = 0;
  matchedPairs = 0;

  isBoardLocked = false;
  isGameComplete = false;

  resetSelectedCards();

  for (const cardData of cards) {
    cardData.isFlipped = false;
    cardData.isMatched = false;
  }

  shuffleCards(cards);

  movesValue.textContent = "0";
  pairsValue.textContent = `0 / ${TOTAL_PAIRS}`;

  renderCards();
}

function showVictoryModal() {
  const modalNewGameButton = createElement(
    "button",
    "button button--primary",
    "Новая игра",
  );

  const modalCloseButton = createElement(
    "button",
    "button button--secondary",
    "Закрыть",
  );

  modalNewGameButton.type = "button";
  modalCloseButton.type = "button";

  modalNewGameButton.addEventListener("click", startNewGame);

  modalCloseButton.addEventListener("click", closeModal);

  openModal("Победа!", `Все пары найдены за ${moves} ходов.`, [
    modalNewGameButton,
    modalCloseButton,
  ]);
}

function createLeaderboardContent(results) {
  if (results.length === 0) {
    return createElement(
      "p",
      "modal__text",
      "Пока нет результатов. Заверши первую игру!",
    );
  }

  const tableWrapper = createElement("div", "leaderboard-wrapper");
  const table = createElement("table", "leaderboard");
  const tableHead = createElement("thead", "leaderboard__head");
  const headingRow = createElement("tr", "leaderboard__row");

  const placeHeading = createElement("th", "leaderboard__cell", "Место");
  const movesHeading = createElement("th", "leaderboard__cell", "Ходы");
  const dateHeading = createElement("th", "leaderboard__cell", "Дата");

  placeHeading.scope = "col";
  movesHeading.scope = "col";
  dateHeading.scope = "col";

  headingRow.append(placeHeading, movesHeading, dateHeading);
  tableHead.append(headingRow);

  const tableBody = createElement("tbody", "leaderboard__body");

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const resultRow = createElement("tr", "leaderboard__row");

    const placeCell = createElement(
      "td",
      "leaderboard__cell leaderboard__place",
      String(i + 1),
    );
    const movesCell = createElement(
      "td",
      "leaderboard__cell",
      String(result.moves),
    );
    const dateCell = createElement(
      "td",
      "leaderboard__cell",
      formatResultDate(result.date),
    );

    resultRow.append(placeCell, movesCell, dateCell);
    tableBody.append(resultRow);
  }

  table.append(tableHead, tableBody);
  tableWrapper.append(table);

  return tableWrapper;
}

function showLeaderboardModal() {
  const results = getSavedResults();
  const leaderboardContent = createLeaderboardContent(results);

  const modalCloseButton = createElement(
    "button",
    "button button--primary",
    "Закрыть",
  );

  modalCloseButton.type = "button";
  modalCloseButton.addEventListener("click", closeModal);

  openModal("Таблица лидеров", leaderboardContent, [modalCloseButton]);
}

function finishGame() {
  if (isGameComplete) {
    return;
  }

  isGameComplete = true;

  saveGameResult(moves);
  showVictoryModal();
}

newGameButton.addEventListener("click", startNewGame);
leaderboardButton.addEventListener("click", showLeaderboardModal);
