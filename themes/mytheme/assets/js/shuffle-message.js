const tagLines = [
    'Cautiously optimistic',
    'Brewer of coffee ☕',
    'Breaker of email chains',
    'Occasionally overeager',
    'Beatle person',
    'Prone to rambling',
    'Long time reader first time blogger',
    'Talks while muted',
    'Pronounces it "jiff"',
    'Night owl',
    'Probably humming somewhere',
    'Just married!'
];

function setRandomTagline() {
    const div = document.getElementsByClassName("bonusTagline")[0];
    const tagLinesCount = tagLines.length;
    const randInt = getRndInteger(0, tagLinesCount);

    const selectedTagLine = tagLines[randInt];

    div.innerHTML = ' / ' + selectedTagLine;
}

function typeRandomTagline() {
    const div = document.getElementsByClassName("bonusTagline")[0];
    const tagLinesCount = tagLines.length;
    const randInt = getRndInteger(0, tagLinesCount);

    const selectedTagLine = tagLines[randInt];

    const charArray = Array.from(selectedTagLine);

    div.innerHTML += ' / ';

    for (let i = 0; i < selectedTagLine.length; i++) {
        setTimeout(() => {
            div.innerHTML = ' / ' + selectedTagLine.substring(0, i + 1);
        }, i * 60);
    }
}

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

// setRandomTagline();
typeRandomTagline();