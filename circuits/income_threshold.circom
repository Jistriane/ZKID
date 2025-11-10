// Income Threshold Circuit
// Prova: income >= threshold sem revelar o valor exato
// Usa circomlib para comparação segura

pragma circom 2.1.5;

include "circomlib/circuits/comparators.circom";

template IncomeThreshold() {
    signal input income;     // privado (ex.: 50000)
    signal input threshold;  // público (ex.: 30000)
    signal input addrHash;   // público: hash da carteira
    signal output ok;        // 1 se income >= threshold

    // GreaterEqThan com 32 bits (suporta até ~4 bilhões)
    component check = GreaterEqThan(32);
    check.in[0] <== income;
    check.in[1] <== threshold;
    
    // addrHash não altera lógica, apenas força binding
    ok <== check.out;
}

component main {public [threshold, addrHash]} = IncomeThreshold();
