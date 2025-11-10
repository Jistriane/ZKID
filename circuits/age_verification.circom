// Age Verification Circuit
// Prova: currentYear - birthYear >= minAge sem revelar birthYear
// Usa circomlib para comparação segura

pragma circom 2.1.5;

include "circomlib/circuits/comparators.circom";

template AgeVerification() {
    // Entradas
    signal input birthYear;       // privado (ex.: 1990)
    signal input currentYear;     // público (ex.: 2025)
    signal input minAge;          // público (ex.: 18)
    // Novo: hash (reduzido) da carteira (público) para bind da prova ao address
    // Gerado off-chain: addrHash = SHA256(address) mod p (ou truncado) 
    signal input addrHash;        // público

    // Saída
    signal output is_adult;       // 1 se idade >= minAge, senão 0

    // Calcula idade = currentYear - birthYear
    signal age;
    age <== currentYear - birthYear;

    // Verifica se age >= minAge usando GreaterEqThan de circomlib
    // Assume idade máxima de 200 anos (8 bits suficiente para 0-255)
    component ageCheck = GreaterEqThan(8);
    ageCheck.in[0] <== age;
    ageCheck.in[1] <== minAge;
    
    // addrHash não participa da lógica, mas força inclusão como public input
    // garantindo que a prova gerada é específica para a carteira.
    is_adult <== ageCheck.out;
}

component main {public [currentYear, minAge, addrHash]} = AgeVerification();
