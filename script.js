// ===================== KONFIGURACJA =====================
const GAME_CONFIG = {
    // TODO: wpisz, gdzie jest fizyczny prezent
    giftLocationInstruction: "Przesyłka znajduję się pod stołem...",
    giftTitle: "OPERACJA: ZAKOŃCZONA",
    personalMessage: "Dziękuję Ci za niesamowity wyjazd! Czas odebrać prawdziwy ładunek.",
    // Litery kodu końcowego, po jednej za każdy poprawny etap (5 etapów = 5 liter)
    codeFragments: ["L", "U", "N", "E", "K"]
};

// ===================== FABUŁA =====================
// Pola etapu z pytaniem:
//   answers - akceptowane odpowiedzi (porównywane po normalizacji: bez polskich znaków, spacji, wielkości liter)
//   exact   - true = odpowiedź musi być identyczna (przydatne dla liczb), domyślnie wystarczy, że wpis ZAWIERA odpowiedź
//   hint    - podpowiedź pokazywana po 2 błędach
//   fragment - indeks litery kodu przyznawanej za dobrą odpowiedź
const storyNodes = {
    start: {
        text: `>>> INICJACJA SZYFROWANEGO POŁĄCZENIA...\n>>> SYSTEM: DIRECT_LINK_v4.2\n\nJeżeli to czytasz, to znaczy, że odnalazłaś moją wiadomość ukrytą pod etui.\nOmijamy oficjalne kanały. To najbezpieczniejsza forma kontaktu.\n\nMyślałaś, że sprawa w Helsinkach została zamknięta, a technicy znaleźli wszystko? Byli w błędzie. Wszyscy szukali danych w kodzie, ale minęli się z celem.\n\nJesteś gotowa poznać prawdę i dokończyć tę operację?`,
        options: [
            { text: "[1] > Rozpocznij procedurę odzyskiwania.", nextNode: "step1" },
            { text: "[2] > Kim jesteś? Wyjaśnij sytuację.", nextNode: "explain" }
        ]
    },
    explain: {
        text: `>>> IDENTITY: CLASSIFIED\n\nNie ma czasu na zbędne pytania. To, co wgrał łącznik w Tallinnie, miało odwrócić uwagę od prawdziwego ładunku. Jeżeli odpowiesz poprawnie na pytania weryfikacyjne, uzyskasz dostęp do zaszyfrowanej lokalizacji obiektu, którego wszyscy szukali.`,
        options: [
            { text: "[1] > Rozumiem. Przejdźmy do rzeczy", nextNode: "step1" }
        ]
    },
    step1: {
        text: `>>> WERYFIKACJA TOŻSAMOŚCI [POZIOM 1/5]\n\nMuszę upewnić się, że wiadomość nie trafiła w niepowołane ręce, odpowiedz:\n\nJak ma na imię gruby?`,
        type: "input",
        answers: ["tiago"],
        hint: "rudy",
        fragment: 0,
        nextNode: "step2"
    },
    step2: {
        text: `>>> WERYFIKACJA [POZIOM 2/5]\n\nTo akurat było proste, spróbujmy coś trudniejszego. Podaj datę wyjazdu`,
        type: "input",
        answers: ["15.04.2026", "16.04.2026", "17.04.2026", "18.04.2026","15-18.04.2026", "15.04.2026-18.04.2026"],
        exact: true,
        hint: "może być dowolny dzień [DD.MM.RRRR]",
        fragment: 1,
        nextNode: "step3"
    },
    step3: {
        text: `>>> WERYFIKACJA [POZIOM 3/5]\n\n Nieźle, jeszcze tylko 3 pytania. Marka czekolady i słodyczy.`,
        type: "input",
        answers: ["kalev"],
        hint: "w sklepie firmowym robiliśmy zakupy",
        fragment: 2,
        nextNode: "step4"
    },
    step4: {
        text: `>>> WERYFIKACJA [POZIOM 4/5]\n\n20260416_175924.jpg jakie zwierzę widzisz?"`,
        type: "input",
        answers: ["jaszczurka","jaszczur","salamandra"],
        hint: "rozowe na szarym tle, przeszukaj zdjecia",
        fragment: 3,
        nextNode: "step5"
    },
    step5: {
        text: `>>> OSTATNIA WERYFIKACJA [POZIOM 5/5]\n\nTeraz najtrudniejsze ale poprawna odpowiedź da mi 100% pewności, że ty to ty. Nazwa lumpeksu gdzie kupiłaś sukienkę.`,
        type: "input",
        answers: ["Sobralt Sobrale","Sobralt","Sobrale","SobraltSobrale"],
        hint: "odnajdz strone rynku i tam poszukaj jakie sa sklepy",
        fragment: 4,
        nextNode: "codeStep"
    },
    codeStep: {
        text: `>>> WSZYSTKIE POZIOMY ZALICZONE.\n\nPotrzebny jest już tylko kod dostępu.`,
        type: "input",
        // answers uzupełniane automatycznie z GAME_CONFIG.codeFragments
        answers: [""],
        hint: "nie ma podpowiedzi",
        nextNode: "final"
    },
    final: {
        text: `>>> TOŻSAMOŚĆ POTWIERDZONA. DOSTĘP PRZYZNANY.\n\nOperacja "PÕHJATÄHT" została pomyślnie doprowadzona do końca. Zneutralizowałaś zagrożenie, a przesyłka dotarła do celu.\n\nTo, czego wszyscy szukali, nie znajduje się na serwerach ani w plikach systemowych. Prawdziwy ładunek jest tuż obok Ciebie w świecie rzeczywistym.`,
        isEnd: true
    }
};

// ===================== LOGIKA =====================
const screen = document.getElementById('terminal-screen');
let isTyping = false;
const collectedFragments = [];

// Normalizacja: małe litery, bez polskich znaków/diakrytyków, tylko litery i cyfry
function normalize(str) {
    return str
        .toLowerCase()
        .replace(/ł/g, 'l')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
}

// Uzupełnij kod końcowy
storyNodes.codeStep.answers = [GAME_CONFIG.codeFragments.join('')];
storyNodes.codeStep.exact = true;

// Ostrzeżenie o niewypełnionych polach TODO
Object.entries(storyNodes).forEach(([key, node]) => {
    if (node.answers && node.answers.some(a => a.startsWith('todo'))) {
        console.warn(`TODO: etap "${key}" nie ma jeszcze własnego pytania/odpowiedzi.`);
    }
});


function typeWriter(text, element, speed = 20, callback = null) {
    isTyping = true;
    let i = 0;

    const cursor = document.createElement('span');
    cursor.className = 'cursor';

    function append(ch) {
        if (ch === '\n') {
            element.insertBefore(document.createElement('br'), cursor);
        } else {
            element.insertBefore(document.createTextNode(ch), cursor);
        }
    }

    function type() {

        if (i < text.length) {
            append(text.charAt(i));
            i++;
            screen.scrollTop = screen.scrollHeight;
            setTimeout(type, speed);
        } else {
            cursor.remove();
            isTyping = false;
            screen.scrollTop = screen.scrollHeight;
            if (callback) callback();
        }
    }

    element.appendChild(cursor);
    type();
}

function logLine(text, className = 'log-line system-msg') {
    const div = document.createElement('div');
    div.className = className;
    div.textContent = text;
    screen.appendChild(div);
    screen.scrollTop = screen.scrollHeight;
    return div;
}

function renderNode(nodeKey) {
    const node = storyNodes[nodeKey];
    const logBlock = document.createElement('div');
    logBlock.className = 'log-line';
    screen.appendChild(logBlock);

    typeWriter(node.text, logBlock, 15, () => {
        if (node.isEnd) {
            renderFinalGift();
        } else if (node.type === 'input') {
            renderInput(node, 0);
        } else if (node.options) {
            renderOptions(node.options);
        }
    });
}

function renderOptions(options) {
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'options-container';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'cmd-btn';
        btn.textContent = opt.text;
        btn.onclick = () => {
            if (isTyping) return;
            optionsContainer.remove();
            logLine(`> ${opt.text}`);
            renderNode(opt.nextNode);
        };
        optionsContainer.appendChild(btn);
    });

    screen.appendChild(optionsContainer);
    screen.scrollTop = screen.scrollHeight;
}

function isCorrect(node, rawValue) {
    const val = normalize(rawValue);
    const answers = node.answers.map(normalize);
    return answers.some(a => node.exact ? val === a : val.includes(a));
}

function renderInput(node, attempts) {
    const inputContainer = document.createElement('div');
    inputContainer.className = 'input-container';

    const prompt = document.createElement('span');
    prompt.className = 'prompt-symbol';
    prompt.textContent = 'ENTER_CODE >';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'cmd-input';
    input.setAttribute('autocapitalize', 'off');
    input.setAttribute('autocorrect', 'off');
    input.setAttribute('autocomplete', 'off');
    input.setAttribute('spellcheck', 'false');



    inputContainer.appendChild(prompt);
    inputContainer.appendChild(input);
    screen.appendChild(inputContainer);
    input.focus();

    const handleSubmit = () => {
        if (isTyping) return;
        const raw = input.value.trim();
        if (!raw) return;

        inputContainer.remove();
        logLine(`ENTER_CODE > ${raw}`);

        if (isCorrect(node, raw)) {
            if (typeof node.fragment === 'number') {
                const letter = GAME_CONFIG.codeFragments[node.fragment];
                collectedFragments.push(letter);
                const msg = document.createElement('div');
                msg.className = 'log-line success-msg';
                screen.appendChild(msg);
                typeWriter(
                    `>>> AUTORYZACJA POZYTYWNA.\n>>> FRAGMENT KODU: [ ${letter} ]  (${collectedFragments.length}/${GAME_CONFIG.codeFragments.length})\n`,
                    msg, 15,
                    () => renderNode(node.nextNode)
                );
            } else {
                renderNode(node.nextNode);
            }
        } else {
            const newAttempts = attempts + 1;
            let failText = `>>> BŁĄD AUTORYZACJI!\nNiepoprawna odpowiedź. Spróbuj ponownie. (próba ${newAttempts})`;
            if (newAttempts >= 2 && node.hint) {
                failText += `\n>>> PODPOWIEDŹ: ${node.hint}`;
            }
            const failBlock = document.createElement('div');
            failBlock.className = 'log-line error-msg';
            screen.appendChild(failBlock);
            typeWriter(failText, failBlock, 12, () => renderInput(node, newAttempts));
        }
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleSubmit();
    });


    screen.scrollTop = screen.scrollHeight;
}

function renderFinalGift() {
    const finalBlock = document.createElement('div');
    finalBlock.className = 'log-line success-msg';
    finalBlock.style.marginTop = '15px';

    const finalText = `\n========================================\n[ LOKALIZACJA PRZESYŁKI FIZYCZNEJ ]\n========================================\n\n${GAME_CONFIG.giftLocationInstruction}\n\n${GAME_CONFIG.personalMessage}\n\n========================================`;

    screen.appendChild(finalBlock);
    typeWriter(finalText, finalBlock, 20);
}

window.onload = () => {
    renderNode('start');
};
