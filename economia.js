// Firestore reference
const db = firebase.firestore();

const playerSelect = document.getElementById("playerSelect");
const valueInput = document.getElementById("valueInput");
const saldoText = document.getElementById("saldo");
const historyTable = document.getElementById("historyTable");

// Carrega jogadores
async function loadPlayers() {
    const snapshot = await db.collection("players").get();

    playerSelect.innerHTML = "";

    snapshot.forEach(doc => {
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = doc.data().nome;
        playerSelect.appendChild(option);
    });

    updatePlayerInfo();
}

playerSelect.addEventListener("change", updatePlayerInfo);

// Atualiza painel do jogador
async function updatePlayerInfo() {
    const id = playerSelect.value;
    if (!id) return;

    const player = await db.collection("players").doc(id).get();
    const data = player.data();

    saldoText.textContent = `R$ ${data.saldo.toFixed(2)}`;

    loadHistory(id);
}

// Carrega histórico
async function loadHistory(id) {
    const snapshot = await db.collection("players")
        .doc(id)
        .collection("transactions")
        .orderBy("data", "desc")
        .get();

    historyTable.innerHTML = "";

    snapshot.forEach(doc => {
        const item = doc.data();
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>${new Date(item.data).toLocaleString()}</td>
            <td>${item.tipo}</td>
            <td>R$ ${item.valor.toFixed(2)}</td>
        `;

        historyTable.appendChild(tr);
    });
}

// Função generalizada
async function updateMoney(id, valor, tipo) {
    const ref = db.collection("players").doc(id);

    await db.runTransaction(async (t) => {
        const doc = await t.get(ref);
        const saldoAtual = doc.data().saldo || 0;

        const novoSaldo = saldoAtual + valor;
        t.update(ref, { saldo: novoSaldo });

        // Registro no histórico
        t.set(
            ref.collection("transactions").doc(),
            {
                tipo,
                valor: Math.abs(valor),
                data: Date.now()
            }
        );
    });

    valueInput.value = "";
    updatePlayerInfo();
}

// Botões
async function addMoney() {
    const id = playerSelect.value;
    const valor = Number(valueInput.value);
    if (valor <= 0) return alert("Digite um valor válido!");
    await updateMoney(id, valor, "Entrada");
}

async function removeMoney() {
    const id = playerSelect.value;
    const valor = Number(valueInput.value);
    if (valor <= 0) return alert("Digite um valor válido!");
    await updateMoney(id, -valor, "Saída");
}

// Iniciar
loadPlayers();
