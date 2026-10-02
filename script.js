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
const modalText = createElement("p", "modal__text");
const modalActions = createElement("div", "modal__actions");

modalPanel.append(modalTitle, modalText, modalActions);
modal.append(modalPanel);

document.body.append(modal);

function openModal(title, text, actionButtons) {
  modalTitle.textContent = title;
  modalText.textContent = text;

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

function finishGame() {
  isGameComplete = true;
  showVictoryModal();
}

newGameButton.addEventListener("click", startNewGame);
