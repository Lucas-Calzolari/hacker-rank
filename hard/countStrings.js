// https://www.hackerrank.com/challenges/count-strings/problem

// Although this challenge required a lot of effort and research it DID NOT WORK, AND STILL DOES NOT WORK.

const HUGE_PRIME = 1000000007
const operators = {
    OR : "OR",
    CONCAT : "CONCAT",
    REPEAT : "REPEAT"
}

//Find first external parenthetis, return null if none
const firstExternalParenthesis = (s) => {
    var parenthesisCounter = 0;
    var left = -1;
    for (var i = 0; i < s.length; i++) {
        if (s[i] == "(") {
            parenthesisCounter++;
            if (left < 0) {
                left = i;
            }
        }
        if (s[i] == ")") {
            parenthesisCounter--;
        }
        if (!parenthesisCounter && (left > -1)){
            return {left, right : i}
        }
    }
    return null;
}

const printTree = (node, offset=0) => {
    const indentation = "   ".repeat(offset)
    if (node.children) {
        console.log(indentation + node.type)
        for (var i in node.children) {
            printTree(node.children[i], offset+1)
        }
    } else {
        console.log(indentation + node.value)
    }

}

const generateTree = (s) => {
    if (s[s.length-1] === "*") {
        return {
            type: operators.REPEAT,
            children: [generateTree(s.slice(0, s.length-1))]
        }
    }

    if (s == "a" || s == "b") {
        return {
            value : s
        }
    }

    const node = {
        type : operators.CONCAT,
        children : []
    }

    const parenthesis = firstExternalParenthesis(s);
    if ( parenthesis && parenthesis.left == 0 && parenthesis.right == s.length-1) {
        const parenthesisContent = s.slice(parenthesis.left+1, parenthesis.right)
        return generateTree(parenthesisContent)
    }
    if (parenthesis===null) {
        node.children.push(generateTree(s[0]))
        if (s.length == 2) {
            node.children.push(generateTree(s[1]))
        } else {
            if (s[1]==='|') {
                node.type = operators.OR;
            }
            node.children.push(generateTree(s[2]))
        }
        return node;
    }
    
    if (parenthesis.left > 0) {
        const literalNode = generateTree(s[0]) 
        node.children.push(literalNode)
    }
    if (parenthesis.left > 1) {
        if (s[1] == "|")
        node.type =  operators.OR
    }

    if (s[parenthesis.right+1] == "|") {
        node.type =  operators.OR
    }
    
    const parenthesisContent = s.slice(parenthesis.left+1, parenthesis.right)
    node.children.push(generateTree(parenthesisContent))
    
    const nextParenthesis = firstExternalParenthesis(s.slice(parenthesis.right+1))
    if (nextParenthesis === null) {
        if (parenthesis.right < s.length-1) {
                const literalNode = generateTree(s[s.length-1]) 
                node.children.push(literalNode)
        }
    } else {
        nextParenthesis.left += parenthesis.right+1
        nextParenthesis.right += parenthesis.right+1
        const nextParenthesisContent = s.slice(nextParenthesis.left+1, nextParenthesis.right)
        node.children.push(generateTree(nextParenthesisContent))
    }
    return node
}

let i = 1
const getNewStateNumber = () => {
    return ""+i++;
}

const createNFALeaf = (letter) => {
    const startState = getNewStateNumber()
    const terminalState = getNewStateNumber()
    return {
        [startState] : {
            a : new Set([]),
            b : new Set([]),
            [letter] : new Set([terminalState]) //Overwrite one of the above
        },
        [terminalState] : {
            a : new Set([]),
            b : new Set([])
        },
        s : startState,
        terminals : new Set([terminalState])
    }
}

const concatNFA = (nfaA, nfaB) => {
    const result = {
        ...nfaA,
        ...nfaB,
        s: nfaA.s,
    }
    
    if (nfaB.terminals.has(nfaB.s)) {
        result.terminals = new Set([...nfaB.terminals, ...nfaA.terminals])
    } else {
        result.terminals = nfaB.terminals
    }
    for (var terminalA of nfaA.terminals) {
        result[terminalA] = {
            a : new Set([...result[terminalA].a, ...nfaB[nfaB.s].a]),
            b : new Set([...result[terminalA].b, ...nfaB[nfaB.s].b]),
        } 
    }

    // console.log("RESULT")
    // printNFA(result)
    return result
}

const loopNFA = (nfa) => {
    for (var terminal of nfa.terminals) {
        nfa[terminal] = {
            a : new Set([...nfa[terminal].a, ...nfa[nfa.s].a]),
            b : new Set([...nfa[terminal].b, ...nfa[nfa.s].b]),
        }
    }
    var aTerminals = [...nfa[nfa.s].a]
    var bTerminals = [...nfa[nfa.s].b]
    for (var terminal of nfa.terminals) {
        aTerminals = aTerminals.concat(...nfa[terminal].a)
        bTerminals = bTerminals.concat(...nfa[terminal].b)
    }
    nfa[nfa.s] = {
        a : new Set(aTerminals),
        b : new Set(bTerminals),
    }


    nfa.terminals = new Set([...nfa.terminals, nfa.s])
    return nfa
}

const orNFA = (nfaA, nfaB) => {
    const startState = getNewStateNumber()
    return {
        ...nfaA,
        ...nfaB,
        [startState]: {
            a : new Set([...nfaA[nfaA.s].a, ...nfaB[nfaB.s].a]),
            b : new Set([...nfaA[nfaA.s].b, ...nfaB[nfaB.s].b])
        },
        s: startState,
        terminals: new Set([...nfaA.terminals, ...nfaB.terminals])
    }
}

const printNFA = (nfa) => {
    for (var key in nfa) {
        if (key != "terminals" && key != "s") {
            console.log(`${key}`)
            if (nfa[key].a.size) {
                console.log("A: " + Array.from(nfa[key].a).join(" "))
            }
            if (nfa[key].b.size) {
                console.log("B: " + Array.from(nfa[key].b).join(" "))        
            }
        }        
    }
    console.log("INITIAL STATE: " + nfa.s)
    console.log("TERMINALS: " + Array.from(nfa.terminals).join(" "))
}

const printDFA = (dfa) => {
    console.log("S   A   B")
    for (var key in dfa) {
        if (key != "terminals" && key != "s") {
            console.log(`${key}   ${dfa[key].a}    ${dfa[key].b}`)
        }        
    }
    console.log("TERMINALS: " + Array.from(dfa.terminals).join(" "))
}

const createNFA = (node) => {
    if (node.value) {
        return createNFALeaf(node.value)
    }
    if (node.type == operators.CONCAT) {
        const nfaA = createNFA(node.children[0])
        const nfaB = createNFA(node.children[1])
        return concatNFA(nfaA, nfaB)
    }
    if (node.type == operators.REPEAT) {
        return loopNFA(createNFA(node.children[0]))
    }
    if (node.type == operators.OR) {
        const nfaA = createNFA(node.children[0])
        const nfaB = createNFA(node.children[1])
        return orNFA(nfaA, nfaB)
    }
}

const generateKeyFromSet = (set) => {
    const array = [...set].sort((a, b)=> (a > b) ? 1 : -1)
    return array.join("_")
}

const getSetsFromKey = key => key.split("_")

const convertNFAtoDFA = (nfa) => {
    const states = [nfa.s]
    const dfa = {}
    while (states.length) {
        const cState = states.shift()
        if (dfa[cState]) {
            continue
        }
        const keys = getSetsFromKey(cState)

        let setA = []
        for (var key of keys) {
            setA = setA.concat([...nfa[key].a])
        }
        setA = new Set([...setA])
        const keySetA = generateKeyFromSet(setA)
        if (keySetA && !dfa[keySetA]) {
            states.push(keySetA)
        }

        let setB = []
        for (var key of keys) {
            setB = setB.concat([...nfa[key].b])
        }
        setB = new Set(setB)

        const keySetB = generateKeyFromSet(setB)
        if (keySetB && !dfa[keySetB]) {
            states.push(keySetB)
        }
        
        dfa[cState] = {
            a: keySetA,
            b: keySetB
        }
    }

    dfa.terminals = []
    for (var key in dfa) {
        const oSet = key.split("_")
        for (var og of oSet) {
            if (nfa.terminals.has(og)) {
                dfa.terminals.push(key)
                break;
            }
        }
    }
    dfa.s = nfa.s
    return dfa
}


const testInputDFA = (input , dfa) => {
    var cState = dfa.s
    for (var c of input) {
        if (!dfa[cState][c]) {
            return false
        }
        cState = dfa[cState][c]
    }
    return dfa.terminals.includes(cState)
}

const getStateIndexMap = (dfa) => {
    const states = Object.keys(dfa).filter(v => (v!="terminals") && v!="s")

    const indexMap = {}
    var i = 0;
    for (var state of states) {
        indexMap[state] = i
        i++
    }
    return indexMap
}

const createMatrixWalks = (dfa, indexMap) => {
    
    const numberStates = Object.keys(indexMap).length
    const walksMatrix = Array(numberStates).fill().map(() => Array(numberStates).fill(0))
    for (var state of Object.keys(indexMap)) {
        if (dfa[state].a) {
            const sourceIndex = indexMap[state]
            const dstIndex = indexMap[dfa[state].a]
            walksMatrix[sourceIndex][dstIndex]++
        }
        if (dfa[state].b) {
            const sourceIndex = indexMap[state]
            const dstIndex = indexMap[dfa[state].b]
            walksMatrix[sourceIndex][dstIndex]++
        }
    }

    return walksMatrix;
}


var matrixPowerCache = {}


const matrixMultiplication = (A, B) => {
    const size = A.length
    const result = Array(size).fill().map(() => Array(size).fill(0))
    
    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            
            var hadamardProduct = 0;
            for (var k = 0; k < size; k++) {
                hadamardProduct = (hadamardProduct + A[i][k]*B[k][j]) % HUGE_PRIME
                if (hadamardProduct > 100000*HUGE_PRIME) {
                    hadamardProduct %= HUGE_PRIME
                }
            }
            result[i][j] = hadamardProduct
        }
    }
    return result
}

const matrixPower = (matrix, power) => {
    if (matrixPowerCache[power]) {
        return matrixPowerCache[power]
    }
    if (power == 1) {
        return matrix
    }
    if (power == 2) {
        const result = matrixMultiplication(matrix, matrix)
        matrixPowerCache[power] = result
        return result
    }
    
    const lowerHalf = Math.floor(power/2)
    const upperHalf = power - lowerHalf
    const resultLowerHalf = matrixPower(matrix, lowerHalf)
    matrixPowerCache[lowerHalf] = resultLowerHalf
    const resultUpperHalf = matrixPower(matrix, upperHalf)
    matrixPowerCache[upperHalf] = resultUpperHalf
    
    return matrixMultiplication(resultLowerHalf, resultUpperHalf)
}

const countStrings = (regex, L) => {
    matrixPowerCache = {}
    const tree = generateTree(regex)
    const nfa = createNFA(tree)
    // printNFA(nfa)
    const dfa = convertNFAtoDFA(nfa)
    const indexMap = getStateIndexMap(dfa)
    const walkMatrix = createMatrixWalks(dfa, indexMap)
    const exponentiation = matrixPower(walkMatrix, L)
    // printDFA(dfa)
    var result = 0
    var startIndex = indexMap[dfa.s]
    for (var terminal of dfa.terminals) {
        var endIndex = indexMap[terminal]

        result = (result+exponentiation[startIndex][endIndex]) % HUGE_PRIME
    }

    
    return result
}

const tests = [
    {
        regex: "((((b*)((b(a|a))a))(((a*)|a)a))((aa)((((((b*)*)(b|((b|(aa))|b)))(a|b))|(b*))*)))",
        L: 937477085,
        result: 971722885
    },
    {
        regex: "(((b(b|((b*)*)))|(((ba)((b|a)|((((b*)b)|b)*)))((b(bb))*)))((a|b)|a))",
        L: 346030097,
        result: 4,
    },
    {
        regex: "(((((a*)*)*)|(b*))*)",
        L: 10,
        result: 1024
    }
    
]

for (var test of tests) {
    const result = countStrings(test.regex, test.L)
    if (result != test.result) {
        console.log("ERRADO")
        console.log(`Expected ${test.result} got ${result}`)
    } else {
        console.log("CERTO");
    }
}

// // const result  = countStrings("(b(a*))", 1)
// const r = "((((a(ab))|((((((a|b)a)a)|(a((a*)b)))a)*))((((b*)a)|(((ab)(b*))|a))|((((a*)*)|a)b)))*)"
// const result = countStrings(r, 514928230)
// console.log(result)