import { initializeApp } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-app.js";
import { getDatabase, ref, onValue, set, get, remove } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-database.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.9.1/firebase-analytics.js";

const firebaseConfig = {
  apiKey: "AIzaSyDkH3yoQVmDV8ivcMoDzPLux_qX1WTzET8",
  authDomain: "aetheria-df72e.firebaseapp.com",
  databaseURL: "https://aetheria-df72e-default-rtdb.firebaseio.com",
  projectId: "aetheria-df72e",
  storageBucket: "aetheria-df72e.firebasestorage.app",
  messagingSenderId: "192928098224",
  appId: "1:192928098224:web:6a351c0a5552fc74de5875",
  measurementId: "G-GFZ5BETC8J"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getDatabase(app);

let revanche = false;
let sala;
let name;

function checaVitoria(tab) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of combos) {
    if (tab[a] && tab[a] === tab[b] && tab[a] === tab[c]) return tab[a];
  }
  return null;
}

function checaEmpate(tab) {
  return tab.every(cell => cell !== '');
}

document.getElementById("voltar").addEventListener('click', () => {
    try {
        set(ref(db, `jogodavelha/${sala}/saida`), 1);
    } catch {}
});

document.getElementById("revanche").addEventListener('click', () => {
    try {
        if (revanche) return;
        const randomNum = Math.floor(Math.random() * 2000) + 1;
        document.getElementById("revanche").classList.remove("show");
        revanche = true;
        const delay = setInterval(() => {
            get(ref(db, `jogodavelha/${sala}/revanche`)).then(snapshot => {
                const q = snapshot.val();
                set(ref(db, `jogodavelha/${sala}/revanche`), q+1);
                clearInterval(delay);
            });
        }, randomNum);
    } catch (erro) {
        // console.error('Erro:', erro);
    }
});

document.getElementById("btn1").addEventListener('click', () => {
    document.getElementById("screen-mi").classList.remove("show");
    document.getElementById("screen-tab").classList.add("show");
    const tabuleiro = document.getElementById('tabuleiro');
    const status = document.getElementById('status');

    sala = document.getElementById("code").value;
    name = document.getElementById("name").value;
    let namead = "";
    let meuSimbolo = '';
    let podeJogar = false;
    let running = true;

    tabuleiro.innerHTML = "";

    for (let i = 0; i < 9; i++) {
        const celula = document.createElement('div');
        celula.classList.add('celula');
        celula.dataset.index = i;
        celula.addEventListener('click', () => {
            if (!podeJogar || celula.textContent !== '' || namead === "<Error: null>" || !running) return;
            set(ref(db, `jogodavelha/${sala}/tabuleiro/${i}`), meuSimbolo);
            set(ref(db, `jogodavelha/${sala}/turno`), meuSimbolo === 'X' ? 'O' : 'X');
        });
        tabuleiro.appendChild(celula);
    }

    get(ref(db, `jogodavelha/${sala}`)).then(snapshot => {
        const dados = snapshot.val();
        if (!dados) {
            set(ref(db, `jogodavelha/${sala}`), {
                tabuleiro: Array(9).fill(''),
                turno: 'X',
                playerX: name,
                playerO: "<Error: null>",
                revanche: 0,
                saida: 0
            });
            meuSimbolo = 'X';
        } else {
            get(ref(db, `jogodavelha/${sala}/playerX`)).then(snapshot => {
                const nomex = snapshot.val();
                if (nomex === name) {
                    meuSimbolo = 'X';
                } else {
                    get(ref(db, `jogodavelha/${sala}/playerO`)).then(snapshot => {
                        const nomeadc = snapshot.val();
                        if (nomeadc === "<Error: null>" || nomeadc === name) {
                            set(ref(db, `jogodavelha/${sala}/playerO`), name);
                            meuSimbolo = 'O';
                        } else {
                            meuSimbolo = "NADA"
                            alert("Jogadores completos!");
                            location.href = "";
                        }
                    });
                }
            });
        };
        get(ref(db, `jogodavelha/${sala}/turno`)).then(snapshot => {
            status.textContent = "Carregando...";
            const delay = setInterval(() => {
                if (meuSimbolo === 'X') {
                    status.textContent = "Aguardando adversário...";
                }
                get(ref(db, `jogodavelha/${sala}/playerO`)).then(snapshot1 => {
                    namead = snapshot1.val();
                    if (namead === "<Error: null>" || !namead || !running) return;
                    get(ref(db, `jogodavelha/${sala}/turno`)).then(snapshot => {
                        const vez = snapshot.val();
                        podeJogar = (vez === meuSimbolo);
                        status.textContent = podeJogar ? `Sua vez (${meuSimbolo})` : `Vez do adversário (${meuSimbolo === 'X' ? 'O' : 'X'})`;
                        clearInterval(delay);
                    });
                });
            }, 1000);
        });
    });

    onValue(ref(db, `jogodavelha/${sala}/revanche`), snapshot => {
        if (snapshot.val() === 2) {
            remove(ref(db, `jogodavelha/${sala}`));
            location.href = `?sala=${sala}&nome=${name}`;
        }
    });

    onValue(ref(db, `jogodavelha/${sala}/saida`), snapshot => {
        if (snapshot.val() === 1) {
            remove(ref(db, `jogodavelha/${sala}`));
            location.href = "";
        }
    }),

    onValue(ref(db, `jogodavelha/${sala}/tabuleiro`), snapshot => {
        const estado = snapshot.val();
        if (!estado || !running) return;
        document.querySelectorAll('.celula').forEach((c, i) => {
            c.textContent = estado[i] || '';
        });
        const vencedor = checaVitoria(estado);
        if (vencedor) {
            running = false;
            status.textContent = `Jogador ${vencedor} venceu!`;
            if (meuSimbolo === "X") {
                meuSimbolo = 'x';
            } else if (meuSimbolo === "O") {
                meuSimbolo = 'o';
            }
            document.getElementById("voltar").classList.add("show");
            document.getElementById("revanche").classList.add("show");
            return;
        }
        if (checaEmpate(estado)) {
            running = false;
            status.textContent = `Empate!`;
            meuSimbolo = meuSimbolo === 'x' ? 'x' : 'o';
            document.getElementById("voltar").classList.add("show");
            document.getElementById("revanche").classList.add("show");
            return;
        }
    });

    onValue(ref(db, `jogodavelha/${sala}/turno`), snapshot => {
        if (!running) return;
        const vez = snapshot.val();
        podeJogar = (vez === meuSimbolo);
        status.textContent = podeJogar ? `Sua vez (${meuSimbolo})` : `Vez do adversário (${vez})`
    });
});

document.getElementById("btn2").addEventListener('click', () => {
    get(ref(db, `jogodavelha`)).then(snapshot => {
        const dados = snapshot.val();
        if (!dados) {
            alert("Nenhuma sala encontrada!");
        } else {
            for (const chave in dados) {
                for (const chave2 in dados[chave]) {
                    if (chave2 === "playerO" && dados[chave][chave2] === "<Error: null>") {
                        document.getElementById("code").value = chave;
                        document.getElementById("btn1").click();
                    }
                }
            }

        }
    })
});

let getSala = null;
let getNome = null;

const params = new URLSearchParams(window.location.search);
getNome = params.get('nome');
getSala = params.get('sala');
const novaURL = `${window.location.origin}${window.location.pathname}`;
history.pushState({}, '', novaURL);
if (getNome && getSala) {
    document.getElementById("code").value = getSala;
    document.getElementById("name").value = getNome;
    document.getElementById('btn1').click();
}