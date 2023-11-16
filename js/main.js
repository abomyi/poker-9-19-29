// https://obfuscator.io/#code
// 定義一個陣列來表示撲克牌的點數和花色
const suits = ['♠', '♥', '♦', '♣'];
const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]; // 此遊戲沒有 'J', 'Q', 'K'。1 = A

// 函數來創建撲克牌元素
function createCardElement(value, suit) {
  const card = document.createElement('div');
  card.classList.add('card');
  card.setAttribute('data-card-suit', suit);
  card.setAttribute('data-card-number', value);

  // 判斷花色
  let suit_class = ''
  switch (suit) {
    case '♠':
      suit_class = 'spade';
      break;
    case '♣':
      suit_class = 'club';
      break;
    case '♥':
      suit_class = 'heart';
      break;
    case '♦':
      suit_class = 'diamond';
      break;
  }
  card.classList.add(suit_class);

  const top = document.createElement('div');
  top.classList.add('card__top');
  top.innerHTML = `<span class="card__value">${value === 1 ? 'A' : value}</span><span class="card__suit">${suit}</span>`;

  const center = document.createElement('div');
  center.classList.add('card__center');
  center.innerHTML = `<span class="card__suit">${suit}</span>`;

  const bottom = document.createElement('div');
  bottom.classList.add('card__bottom');
  bottom.innerHTML = `<span class="card__value">${value === 1 ? 'A' : value}</span><span class="card__suit">${suit}</span>`;

  card.appendChild(top);
  card.appendChild(center);
  card.appendChild(bottom);

  card.addEventListener('click', function () {
    clickCard(this);
  });

  return card;
}

// 創建一個空陣列來存儲牌組
let deck = [];

// 初始化牌組
function initializeDeck() {
  deck = [];
  for (const suit of suits) {
    for (const value of values) {
      deck.push({
        suit,
        value
      });
    }
  }
}

// 洗牌函數(從最後一張牌開始往前隨機跟某個位置交換)
function shuffleDeck() {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// 刷新介面提示
function updateDeckCount() {
  // TODO: 改成listener的形式，只要deck變動就更新;而不是在每個變動的地方呼叫此function
  document.querySelector('#deck-count').innerHTML = deck.length;
}


const classGroup = 'card-group';
const cardTable = document.querySelector('.card-table');

class CircularArray {

  constructor() {
    this.reset();
  }

  next() {
    // 處理空陣列情況
    if (this.array.length === 0) {
      return null;
    }

    // 獲取下一個元素
    const value = this.array[this.index];

    // 更新 index
    this.updateIndex();

    return value;
  }

  updateIndex(i = 1) {
    this.index += i;
    if (this.index >= this.array.length) {
      this.index = 0;
    }
  }

  remove(element) {
    const index = this.array.indexOf(element);
    if (index !== -1) {
      this.array.splice(index, 1);
    }

    if (index === this.index) {
      // 如果被清掉的是即將要發牌的group, 將順位往後發到下個牌堆
      this.updateIndex();
    } else if (index < this.index) {
      // 如果被清掉的是前面的group, 代表下個要發的牌堆順位會往前
      this.updateIndex(-1);
    }
  }

  reset() {
    this.index = 0;
    this.array = Array.from(document.querySelectorAll(`.${classGroup}`));
  }
}
const cardGroups = new CircularArray();

const dealButton = document.getElementById('deal-button');
dealButton.addEventListener('click', function () {
  // 確保牌組不為空
  if (deck.length == 0) {
    lose();
    return;
  }
  // 發牌(從牌組中取出第一張牌)
  const dealtCard = deck.shift();
  updateDeckCount();

  // 創建一個新的卡片元素，並設置內容
  const cardElement = createCardElement(dealtCard.value, dealtCard.suit);

  // 添加到牌桌上
  cardGroups.next().appendChild(cardElement);

  // TODO: 當群組內的牌超過N張後，只顯示前三張、後三張牌

  // 將背景顏色改為白色，觸發漸變效果
  //    setTimeout(function () {
  //        cardElement.style.backgroundColor = 'white';
  //    }, 1);
});


const classSelected = 'card-selected';

function clickCard(card) {
  //    console.dir(card);
  // TODO: 播放音效

  let cardSelected = document.querySelectorAll(`.${classSelected}`);

  // 如果是取消已被選到的牌，取消class且不做後續判斷
  if (card.classList.contains(classSelected)) {
    card.classList.toggle(classSelected);
    return;
  }

  if (cardSelected.length > 0) {
    const cardSelectedGroup = cardSelected[0].closest(`.${classGroup}`);

    // 確定點選的牌是屬於同一排( TODO: 這個判斷可能是多餘的，因為只要判斷是否連續即可，待完成後確認是否移除)
    if (card.closest(`.${classGroup}`).id != cardSelectedGroup.id) {
      return;
    }

    // 檢查點選的牌是否是連續的
    const previousCard = card.previousElementSibling || cardSelectedGroup.querySelector('.card:last-child');
    const nextCard = card.nextElementSibling || cardSelectedGroup.querySelector('.card:first-child');
    if (!(previousCard && previousCard.classList.contains(classSelected)) &&
      !(nextCard && nextCard.classList.contains(classSelected))) {
      return;
    }
  }

  card.classList.toggle(classSelected);
  cardSelected = document.querySelectorAll(`.${classSelected}`);
  if (cardSelected.length == 3) {
    const isValid = verifySelectedCards(Array.from(cardSelected));
    if (!isValid) {
      card.classList.toggle(classSelected);
    }
  }
}

function verifySelectedCards(cards) {
  if (cards.length !== 3) {
    return false;
  }
  const sum = cards.reduce((total, card) => {
    const cardNumber = card.getAttribute('data-card-number');
    const parsedNumber = parseInt(cardNumber, 10);
    return total + parsedNumber;
  }, 0);

  if ([9, 19, 29].includes(sum)) {
    // 總和為 9、19 或 29 時的操作
    discard(cards);
    // TODO: 播放音效
    return true;
  }
  return false;

}

function discard(cards) {
  // 從頁面上移除卡片，並將被移除的牌重新放回牌組(deck)後面
  if (!Array.isArray(cards)) {
    cards = [cards];
  }

  const uiGroup = cards[0].parentElement;
  cards.forEach(card => {
    card.remove();

    const cardSuit = card.getAttribute('data-card-suit');
    const cardNumber = card.getAttribute('data-card-number');
    deck.push({
      suit: cardSuit,
      value: parseInt(cardNumber, 10)
    });
  });
  updateDeckCount();

  if (verifyDeck()) {
    return win();
  }

  if (uiGroup.querySelectorAll('div.card').length === 0 && document.querySelectorAll(`.${classGroup}`).length > 1) {
    // 當這一行沒有任何牌時，移除此牌，並且後續發牌會跳過此行
    uiGroup.remove();
    cardGroups.remove(uiGroup);
  }
}

function verifyDeck() {
  const remainingCards = document.querySelectorAll('.card');

  let checkIndex = 0;
  if (remainingCards.length > 1) {
    // 如果牌桌上還剩餘超過一張牌，代表還沒結束
    return false;
  } else if (remainingCards.length === 0) {
    // 牌桌上沒牌，此時牌組的第一張牌應該要是3，驗證剩餘的牌
    if (deck[0].value !== 3) {
      return false;
    }
    checkIndex = 1;
  } else if (remainingCards.length === 1) {
    // 牌桌上有牌，此時這張牌必定要是3
    if (remainingCards[0].getAttribute('data-card-number') != '3') {
      return false;
    }
  }

  // 驗算剩餘的39張牌，是否每三張的加總均為9/19/29
  for (let i = checkIndex; i < deck.length; i += 3) {
    let sum = deck.slice(i, i + 3).reduce((total, curr) => total + (parseInt(curr.value, 10)), 0);
    console.log(`第 ${i / 3 + 1} 次迴圈: ${sum}`);
    if (![9, 19, 29].includes(sum)) {
      return false;
    }
  }
  return true;
}


// TODO: debug用，完成後請移除 (每次重整直接發N張牌)
function debug() {
  for (let i = 0; i < 12; i++) {
    dealButton.click();
  }
  // const lastGroup = document.getElementById('card-group4');
  // const cards = lastGroup.querySelectorAll('div.card');
  // cards.forEach(card => {
  //   card.setAttribute('data-card-number', 3);
  //   const cardValueElements = card.querySelectorAll('div.card > div.card__top > span.card__value');
  //   cardValueElements.forEach(element => {
  //     element.textContent = '3';
  //   });
  // });
}

function startNewGame() {
  // 移除牌桌上所有牌
  const removeGroups = document.querySelectorAll(`.${classGroup}`);
  removeGroups.forEach(el => { el.remove(); });

  // 將預設的發牌群組添加到牌桌上
  cardTable.innerHTML = `
    <div id="card-group1" class="card-group"></div>
    <div id="card-group2" class="card-group"></div>
    <div id="card-group3" class="card-group"></div>
    <div id="card-group4" class="card-group"></div>`;
  cardGroups.reset();

  // 調用初始化函數來創建牌組
  initializeDeck();

  // 調用洗牌函數
  shuffleDeck();

  debug();
}
startNewGame();

function win() {
  // TODO: 勝利音效
  if (confirm('恭喜! 你成功了!\n 要進行驗證嗎?')) {
    // TODO: 自動進行遊戲N次
  } else {
    if (confirm('要開始新的一局嗎?')) {
      console.log('restart');
      startNewGame();
    }
  }
}

function lose() {
  // TODO: 音效
  if (confirm('牌組已經發完了！GG! 你輸了!\n 要重來嗎?')) {
    console.log('restart');
    startNewGame();
  }
}

