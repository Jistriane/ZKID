// Country Verification Circuit
// Prova: country == TARGET sem revelar dados adicionais
// Usa circomlib para comparação segura

pragma circom 2.1.5;

include "circomlib/circuits/comparators.circom";

template CountryVerification() {
    // Entradas
    signal input countryCode; // privado (e.g., 76 = BR ISO numeric)
    signal input targetCode;  // público (país alvo)
    signal input addrHash;    // público: hash da carteira para bind
    
    // Saída
    signal output is_target;  // 1 se o país corresponde

    // Verifica igualdade usando IsEqual de circomlib
    component eq = IsEqual();
    eq.in[0] <== countryCode;
    eq.in[1] <== targetCode;
    
    // addrHash é apenas incorporado como public input
    is_target <== eq.out;
}

component main {public [targetCode, addrHash]} = CountryVerification();
