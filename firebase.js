// -----------------------------------------------------
//  Firebase – Inicialização do projeto
//  Substitua o firebaseConfig pelo seu próprio código
// -----------------------------------------------------

const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "SEU_PROJETO.firebaseapp.com",
    projectId: "SEU_PROJETO",
    storageBucket: "SEU_PROJETO.appspot.com",
    messagingSenderId: "SEU_ID",
    appId: "SEU_APP_ID"
};

// Inicializa o app
firebase.initializeApp(firebaseConfig);

// Inicializa os serviços
const auth = firebase.auth();
const db = firebase.firestore();


// -----------------------------------------------------
//  FUNÇÕES DE AUTENTICAÇÃO
// -----------------------------------------------------

// Registrar novo usuário
async function registrarUsuario(email, senha, nome, tipo) {
    const cred = await auth.createUserWithEmailAndPassword(email, senha);

    await db.collection("users").doc(cred.user.uid).set({
        nome: nome,
        email: email,
        tipo: tipo, // "admin" ou "jogador"
        saldo: 0,
        criadoEm: new Date()
    });

    return cred;
}

// Login
function login(email, senha) {
    return auth.signInWithEmailAndPassword(email, senha);
}

// Logout
function logout() {
    return auth.signOut();
}

// Pegar dados do usuário logado
function getUserData(uid) {
    return db.collection("users").doc(uid).get();
}


// -----------------------------------------------------
//  SISTEMA DE TIMES
// -----------------------------------------------------

function criarTime(nome, descricao, cor) {
    return db.collection("teams").add({
        nome,
        descricao,
        cor,
        criadoEm: new Date()
    });
}

function listarTimes() {
    return db.collection("teams").get();
}


// -----------------------------------------------------
//  SISTEMA DE JOGADORES
// -----------------------------------------------------

function criarJogador(nome, posicao, time, overall) {
    return db.collection("players").add({
        nome,
        posicao,
        time,
        overall,
        criadoEm: new Date()
    });
}

function listarJogadores() {
    return db.collection("players").get();
}


// -----------------------------------------------------
//  SISTEMA MONETÁRIO
// -----------------------------------------------------

// Adicionar dinheiro
async function adicionarSaldo(uid, valor) {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const novoSaldo = (userDoc.data().saldo || 0) + valor;

    await userRef.update({ saldo: novoSaldo });

    await registrarTransacao(uid, valor, "depósito");

    return novoSaldo;
}

// Remover dinheiro
async function removerSaldo(uid, valor) {
    const userRef = db.collection("users").doc(uid);
    const userDoc = await userRef.get();

    const saldoAtual = userDoc.data().saldo || 0;

    if (valor > saldoAtual) {
        throw new Error("Saldo insuficiente");
    }

    const novoSaldo = saldoAtual - valor;

    await userRef.update({ saldo: novoSaldo });

    await registrarTransacao(uid, -valor, "saque");

    return novoSaldo;
}

// Registrar transação
function registrarTransacao(uid, valor, tipo) {
    return db.collection("transactions").add({
        uid,
        valor,
        tipo,
        data: new Date()
    });
}

// Listar transações
function listarTransacoes(uid) {
    return db.collection("transactions")
        .where("uid", "==", uid)
        .orderBy("data", "desc")
        .get();
}
