let expenses = [];
let exchangeRates = null;

onload = () => {
  storageExpenses = JSON.parse(localStorage.getItem("expenses"));

  if (storageExpenses != null && storageExpenses.length > 0) {
    expenses = storageExpenses;
    calculateExpensesList();
  }
};

function addExpense() {
  var currentId = document.getElementById("expenseId").textContent;
  var description = document.getElementById("description").value;
  var amount = document.getElementById("amount").value;
  var unitValue = document.getElementById("unitValue").value;
  var originCurrency = document.getElementById("originCurrency").value;
  var destinyCurrency = document.getElementById("destinyCurrency").value;

  if (
    description != null &&
    description != "" &&
    amount != "" &&
    unitValue != "" &&
    originCurrency != null &&
    originCurrency != "" &&
    destinyCurrency != null &&
    destinyCurrency != ""
  ) {
    if (currentId) {
      var expense = {
        id: currentId,
        description: description,
        amount: amount,
        unitValue: unitValue,
        originCurrency: originCurrency,
        destinyCurrency: destinyCurrency,
      };

      var index = expenses.findIndex((e) => {
        return e.id === currentId;
      });

      expenses[index] = expense;
    } else {
      expenses.push({
        id: criaUUID(),
        description: description,
        amount: amount,
        unitValue: unitValue,
        originCurrency: originCurrency,
        destinyCurrency: destinyCurrency,
      });
    }
    localStorage.setItem("expenses", JSON.stringify(expenses));
    document.getElementById("expenseId").textContent = null;
    document.getElementById("description").value = null;
    document.getElementById("amount").value = null;
    document.getElementById("unitValue").value = null;
    document.getElementById('expenseId').value = null;
  }

  calculateExchangeRates(originCurrency, "USD");
  calculateExpensesList();
}

function criaUUID() {
  var S4 = function () {
    return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  };
  return (
    S4() +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    "-" +
    S4() +
    S4() +
    S4()
  );
}

async function calculateExpensesList() {
  let i = 0;
  document.getElementById("expenses").innerHTML = "";
  expenses.forEach(async (expense) => {
    let expenseRow = document.createElement("div");

    let expenseContent = document.createElement("div");

    let expenseDescription = document.createElement("span");
    expenseDescription.textContent = await calculateDescription(
      expense.description,
      expense.amount,
      expense.unitValue,
      expense.originCurrency,
      expense.destinyCurrency
    );

    expenseContent.appendChild(expenseDescription);

    let actions = document.createElement("div");
    actions.id = 'actions';

    let deleteButton = calculateDeleteButton(expense, i);
    let editButton = calculateEditButton(expense, i);

    actions.appendChild(editButton);
    actions.appendChild(deleteButton);

    expenseRow.appendChild(expenseContent);
    expenseRow.appendChild(actions);

    document.getElementById("expenses").appendChild(expenseRow);

    i++;
  });

  await calculateTotalOrigin();
}

function calculateEditButton(expense, index) {
  let editButton = document.createElement("a");
  editButton.type = "button";
  editButton.value = index;
  editButton.onclick = function () {
    var expenseId = document.getElementById('expenseId');
    expenseId.textContent = expense.id;

    document.getElementById("description").value = expense.description;
    document.getElementById("amount").value = expense.amount;
    document.getElementById("unitValue").value = expense.unitValue;
    document.getElementById("originCurrency").value = expense.originCurrency;
    document.getElementById("destinyCurrency").value = expense.destinyCurrency;
  };
  let editIcon = document.createElement("img");
  editIcon.src = "assets/edit.png";
  editIcon.style.width = "25px";
  editIcon.style.height = "25px";

  editButton.appendChild(editIcon);

  return editButton;
}

function calculateDeleteButton(expense, index) {
  let deleteButton = document.createElement("a");
  deleteButton.type = "button";
  deleteButton.value = index;
  deleteButton.onclick = function () {
    var expenseList = document.getElementById("expenses");
    var id = expense.id;
    expenseList.children[this.value].remove();
    var index = expenses.findIndex((e) => {
      return e.id === id;
    });
    expenses.splice(index, 1);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    calculateExpensesList();
  };
  let deleteIcon = document.createElement("img");
  deleteIcon.src = "assets/delete.png";
  deleteIcon.style.width = "25px";
  deleteIcon.style.height = "25px";

  deleteButton.appendChild(deleteIcon);

  return deleteButton;
}

async function calculateTotalOrigin() {
  let totalOrigin = 0;
  let totalDestiny = 0;
  const promises = expenses.map(async (expense) => {
    await calculateExchangeRates(
      expense.originCurrency,
      expense.destinyCurrency
    );
    totalOrigin +=
      expense.amount *
      exchangeRates[expense.originCurrency] *
      expense.unitValue;
    totalDestiny +=
      expense.amount *
      exchangeRates[expense.destinyCurrency] *
      expense.unitValue;
  });
  await Promise.all(promises);

  document.getElementById("total").innerHTML = "";
  let totalCard = document.createElement("div");

  let totalOriginDescription = document.createElement("span");
  totalOriginDescription.textContent = `Total (Moeda de Origem): ${totalOrigin}`;

  let totalDestinyDescription = document.createElement("span");
  totalDestinyDescription.textContent = `Total (Moeda de Destino): ${totalDestiny}`;

  totalCard.appendChild(totalOriginDescription);
  totalCard.appendChild(totalDestinyDescription);

  document.getElementById("total").appendChild(totalCard);
}

async function calculateDescription(
  description,
  amount,
  unitValue,
  originCurrency,
  destinyCurrency
) {
  let exchangeRate = await calculateExchangeRates(
    originCurrency,
    destinyCurrency
  );
  return `${description} (Qtd: ${amount}) ${unitValue} ${originCurrency} => ${
    amount * unitValue * exchangeRate
  } ${destinyCurrency}`;
}

async function calculateExchangeRates(currencyFrom, currencyTo) {
  try {
    let response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${currencyFrom}`
    );
    let data = await response.json();
    exchangeRates = data.rates;

    return await exchangeRates[currencyTo];
  } catch (err) {
    console.error(err);
  }
}
