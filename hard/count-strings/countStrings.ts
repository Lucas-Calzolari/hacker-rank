import BigNumber from "../../environment/bignumber"

enum TerminalValue {
    A = "a",
    B = "b"
}

enum RegexOperator {
    TERMINAL = "TERMINAL",
    OR = "OR",
    CONCAT = "CONCAT",
    REPEAT = "REPEAT"
}

interface RegexNode {
    type : RegexOperator,
    value? : TerminalValue,
    children? : Array<RegexNode>
}

interface ParenthesisPosition {
    start : number,
    end : number
}

const findOuterParenthesis = (text : string) : Array<ParenthesisPosition> => {
    const parenthesis : Array<ParenthesisPosition> = []
    let currentParenthesis : ParenthesisPosition = {
        start : -1,
        end : -1
    }
    let parenthesisCounter = 0;

    for (var index in (text as any)) {
        const letter = text[index] as string
        if (letter == "(") {
            parenthesisCounter++
            if (currentParenthesis.start < 0) {
                currentParenthesis.start = parseInt(index)
            }
        }
        if (letter == ")") {
            parenthesisCounter--
            if (parenthesisCounter == 0 && currentParenthesis.start >= 0){
                currentParenthesis.end = parseInt(index)
            }
        }

        if (currentParenthesis.end >= 0) {
            parenthesis.push(currentParenthesis)
            currentParenthesis = {
                start : -1,
                end : -1
            }
        }
    }

    return parenthesis
}

export const generateTree = (regex : string) : RegexNode => {
    if ((regex == TerminalValue.A) || (regex == TerminalValue.B)) {
        return {
            type: RegexOperator.TERMINAL,
            value : regex
        }
    }

    const parenthesis = findOuterParenthesis(regex)

    
    const REPEAT_REGEX = /^\((.*)\*\)$/
    const matchRepeat = REPEAT_REGEX.exec(regex)
    if ((parenthesis.length==1) && matchRepeat){
        return {
            type: RegexOperator.REPEAT,
            children : [generateTree(matchRepeat[1])]
        }
    }
    
    if ((parenthesis.length == 1) && (parenthesis[0].start == 0) && (parenthesis[0].end == regex.length-1)) {
        return generateTree(regex.slice(1, regex.length-1))
    }
    
    if (parenthesis.length == 2) {
        const secondParenthesisStart = parenthesis[1].start
        if (regex[secondParenthesisStart-1] == "|") {
            return {
                type: RegexOperator.OR,
                children: [
                    generateTree(regex.slice(0, secondParenthesisStart-1)),
                    generateTree(regex.slice(secondParenthesisStart))
                ]
            }
        } else {
            return {
                type: RegexOperator.CONCAT,
                children: [
                    generateTree(regex.slice(0, secondParenthesisStart)),
                    generateTree(regex.slice(secondParenthesisStart))
                ]
            }
        }
    }
    if (parenthesis.length == 1) {
        const isParenthesisLeft = (parenthesis[0].start == 0) 
        let separatorIndex = isParenthesisLeft ?  (parenthesis[0].end + 1) : (parenthesis[0].start - 1)
        if (regex[separatorIndex] == "|") {
            return {
                type: RegexOperator.OR,
                children: [
                    generateTree(regex.slice(0, separatorIndex)),
                    generateTree(regex.slice(separatorIndex+1))
                ]
            }
        } else {
            separatorIndex = isParenthesisLeft ? separatorIndex : (separatorIndex + 1)
            return {
                type: RegexOperator.CONCAT,
                children: [
                    generateTree(regex.slice(0, separatorIndex)),
                    generateTree(regex.slice(separatorIndex))
                ]
            }
        }
    }

    const TERMINAL_CONCAT = /^([ab])([ab])$/
    const matchTerminalConcat = TERMINAL_CONCAT.exec(regex)
    if (matchTerminalConcat){
        return {
            type: RegexOperator.CONCAT,
            children : [
                generateTree(matchTerminalConcat[1]),
                generateTree(matchTerminalConcat[2])
            ]
        }
    }

    const TERMINAL_OR = /^([ab])\|([ab])$/
    const matchTerminalOr = TERMINAL_OR.exec(regex)
    if (matchTerminalOr){
        return {
            type: RegexOperator.OR,
            children : [
                generateTree(matchTerminalOr[1]),
                generateTree(matchTerminalOr[2])
            ]
        }
    }

    throw new Error ("Never")
}

export const generateRegex = (tree : RegexNode) : string => {
    if (tree.type == RegexOperator.REPEAT) {
        return `(${generateRegex(tree.children[0])}*)`
    }
    if (tree.type == RegexOperator.TERMINAL) {
        return tree.value
    }
    if (tree.type == RegexOperator.CONCAT) {
        return `(${generateRegex(tree.children[0])}${generateRegex(tree.children[1])})`
    }
    if (tree.type == RegexOperator.OR) {
        return `(${generateRegex(tree.children[0])}|${generateRegex(tree.children[1])})`
    }
}

interface NFA {
    s: string,
    terminals: Set<string>
    transitions : {
        [state : string] : {
            a : Set<string>,
            b : Set<string>,
            c : Set<string>
        } 
    }
}

const HUGE_PRIME = 1000000007

let i = 1
const getNewState = () => {
    return ""+i++;
}

const createNFALeaf = (letter : string) : NFA => {
    const startState = getNewState()
    const endState = getNewState()
    return {
        s: startState,
        terminals: new Set([endState]),
        transitions: {
            [startState] : {
                a : new Set(),
                b : new Set(),
                [letter] : new Set([endState]),
                c : new Set()
            },
            [endState] : {
                a : new Set(),
                b : new Set(),
                c : new Set()
            }
        }
    }
}
const createNFALoop = (nfa : NFA) : NFA => {

    const newRootState = getNewState()
    const newRoot = {
        a : <Set<string>> new Set(),
        b : <Set<string>> new Set(),
        c : <Set<string>> new Set([nfa.s])
    }
    nfa.transitions[newRootState] = newRoot
    nfa.terminals.add(newRootState)
    nfa.s = newRootState

    for (let terminal of nfa.terminals) {
        nfa.transitions[terminal].c.add(newRootState)
    }

    return nfa
}

const createNFAConcat = (nfaA : NFA, nfaB : NFA) : NFA => {
    for (let terminal of nfaA.terminals) {
        nfaA.transitions[terminal].c.add(nfaB.s)
    }
    nfaA.transitions = {...nfaA.transitions, ...nfaB.transitions}
    nfaA.terminals = nfaB.terminals

    return nfaA
}

const createNFAOr = (nfaA : NFA, nfaB : NFA) : NFA => {
    
    const newState = getNewState()

    return {
        s : newState,
        terminals: new Set([...nfaA.terminals, ...nfaB.terminals]),
        transitions : {
            ...nfaA.transitions,
            ...nfaB.transitions,
            [newState] : {
                a : new Set(),
                b : new Set(),
                c : new Set([nfaA.s, nfaB.s])
            }
        }
    }
}

const createNFA = (node : RegexNode) : NFA => {
    if (node.type == RegexOperator.TERMINAL) {
        return createNFALeaf(node.value)
    }
    if (node.type == RegexOperator.REPEAT) {
        return createNFALoop(createNFA(node.children[0]))
    }
    if (node.type == RegexOperator.CONCAT) {
        return createNFAConcat(
                    createNFA(node.children[0]),
                    createNFA(node.children[1]),)
    }

    if (node.type == RegexOperator.OR) {
        return createNFAOr(
            createNFA(node.children[0]),
            createNFA(node.children[1]),)
    }
}

const printNFA = (nfa : NFA) : void => {
    console.log(`ROOT : ${nfa.s}`)
    console.log(`TERMINALS : ${[...nfa.terminals].join(" ")}`)
    for (var state in nfa.transitions) {
        console.log(`STATE : ${state}`)
        console.log(`A : ${[...nfa.transitions[state].a].join(" ")}`)
        console.log(`B : ${[...nfa.transitions[state].b].join(" ")}`)
        console.log(`C : ${[...nfa.transitions[state].c].join(" ")}`)
    }
}

const printDFA = (dfa : DFA) : void => {
    console.log(`ROOT : ${dfa.s}`)
    console.log(`TERMINALS : ${[...dfa.terminals].join(" ")}`)
    for (var state in dfa.transitions) {
        console.log(`STATE : ${state}`)
        if (dfa.transitions[state].a) {
            console.log(`A : ${dfa.transitions[state].a}`)
        }
        if (dfa.transitions[state].b) {
            console.log(`B : ${dfa.transitions[state].b}`)
        }
    }
}

interface DFA {
    s : string,
    transitions : {
        [key : string] : {
            a? : string,
            b? : string
        }
    }
    terminals: Set<string>
}
//Merge identical nodes
const minifyDFA = (dfa : DFA) => {
    const mergeMap : {[key : string] : string} = {}
    const alreadyMerged : Array<string> = []
    
    for (var state in dfa.transitions) {
        if (alreadyMerged.includes(state)) {
            continue
        }
        alreadyMerged.push(state)

        for (var bState in dfa.transitions) {
            const isTransitionASame = (dfa.transitions[state].a == dfa.transitions[bState].a)
            const isTransitionBSame = (dfa.transitions[state].b == dfa.transitions[bState].b)
            const isTerminalSame = (dfa.terminals.has(state) && dfa.terminals.has(bState)) || (!dfa.terminals.has(state) && !dfa.terminals.has(bState))

            const isSameState = isTransitionASame && isTransitionBSame && isTerminalSame 
            if (isSameState) {
                alreadyMerged.push(bState)
                mergeMap[bState] = state
            }
        }
    }

    for (var state in dfa.transitions) {

        if (dfa.transitions[state].a) {
            dfa.transitions[state].a = mergeMap[dfa.transitions[state].a]
        }
        if (dfa.transitions[state].b) {
            dfa.transitions[state].b = mergeMap[dfa.transitions[state].b]
        }

        const newState = mergeMap[state]
        if (newState != state) {
            dfa.transitions[newState] = dfa.transitions[state]
            delete dfa.transitions[state]
        }

        // console.log({newState})
        // console.log(dfa.transitions[newState])
    }

    dfa.s = mergeMap[dfa.s]
    dfa.terminals = new Set([...dfa.terminals].map(s => mergeMap[s]))

    return dfa
}

const encodeStatesSet = (states: Set<string>) => {
    const sortedStates = [...states]
    sortedStates.sort()
    return sortedStates.join("_")
}

const decodeStatesSet = (states: string) => {
    return states.split("_").filter(s => s.length)
}

const NFAtoDFA = (nfa : NFA) => {

    const dfaStartState = encodeStatesSet(new Set(getClousure(nfa, nfa.s)))

    const dfa : DFA = {
        s : dfaStartState,
        transitions: {},
        terminals : new Set()
    }

    const statesQueue = [dfaStartState]
    while (statesQueue.length > 0) {
        const cState = statesQueue.shift()

        if (cState == "") {
            continue
        }

        const cStateSet = decodeStatesSet(cState)
        let reachableA : Set<string> = getReachable(nfa, [...cStateSet], "a")
        const keyA = encodeStatesSet(reachableA)
        
        let reachableB : Set<string> = getReachable(nfa, [...cStateSet], "b")
        const keyB = encodeStatesSet(reachableB)

        if (dfa.transitions[keyA] == undefined) {
            statesQueue.push(keyA)
        }
        if (dfa.transitions[keyB] == undefined) {
            statesQueue.push(keyB)
        }

        dfa.transitions[cState] = {
            a : keyA,
            b : keyB
        }
    }

    for (var state in dfa.transitions) {
        const stateSet = decodeStatesSet(state)
        for (var rawState of stateSet) {
            if (nfa.terminals.has(rawState)) {
                dfa.terminals.add(state)
            }
        }
    }

    return dfa
}

interface IndexMap {
    [state : string] : number
}
const DFAMapIndex = (dfa : DFA) => {
    let index = 0;
    let indexMap : IndexMap = {}
    for (var state in dfa.transitions) {
        if (indexMap[state] == undefined) {
            indexMap[state] = index++
        }
    }

    return indexMap
}

const getClousure = (nfa : NFA, state : string) : Array<string> => {
    const eClousure : Array<string> = [state]
    let i = 0
    while (i < eClousure.length) {
        const cState = eClousure[i]
        for (var adjacency of nfa.transitions[cState].c) {
            if (eClousure.includes(adjacency) == false) {
                eClousure.push(adjacency)
            }
        }
        i++
    }

    return eClousure
}

const getReachable = (nfa: NFA, states : Array<string>, letter : string) : Set<string> => {
    const reachableStates = []
    for (let cState of states) {
        for (var adjacency of nfa.transitions[cState][letter]) {
            if (reachableStates.includes(adjacency) == false) {
                reachableStates.push(adjacency)
            }
        }
    }

    let reachableClousure : Set<string> = new Set()
    for (var state of reachableStates) {
        const cClousure = getClousure(nfa, state)
        reachableClousure = new Set([...reachableClousure, ...cClousure])
    }

    return reachableClousure
}

const createWalkMatrix = (dfa : DFA) => {
    const size = Object.keys(dfa.transitions).length
    const walkMatrix = Array(size).fill(null).map(() => Array(size).fill(0))
    for (var state in dfa.transitions) {
        const srcIndex = state
        if (dfa.transitions[state].a) {
            const aIndex = parseInt(dfa.transitions[state].a)
            if (isNaN(aIndex) == false) {
                walkMatrix[srcIndex][aIndex]++
            }
        }

        if (dfa.transitions[state].b) {
            const bIndex = parseInt(dfa.transitions[state].b)
            if (isNaN(bIndex) == false) {
                walkMatrix[srcIndex][bIndex]++
            }
        }
    }

    return walkMatrix
}
type Matrix = Array<Array<number>>
const multiplyMatrices = (A : Matrix, B : Matrix) => {
    const size = A.length
    const result = Array(size).fill(null).map(() => Array(size).fill(0))

    for (var i = 0; i < size; i++) {
        for (var j = 0; j < size; j++) {
            let cellValue = new BigNumber(0)
            for (var k = 0; k < size; k++) {
                cellValue = cellValue.plus(new BigNumber(A[i][k]).times(new BigNumber(B[k][j])))
            }
            cellValue = cellValue.mod(HUGE_PRIME)
            
            result[i][j] = cellValue.toNumber()
        }
    }
    return result
}

const matrixPower = (matrix : Matrix, power : number) : Matrix  => {

    if (power == 1) {
        return matrix
    }
    
    let halfPower = Math.floor(power/2)
    let halfMatrix = matrixPower(matrix, halfPower)
    
    let halfMatrixSquared = multiplyMatrices(halfMatrix, halfMatrix)
    
    let result = (power % 2) ? multiplyMatrices(halfMatrixSquared, matrix) : halfMatrixSquared
    return result

}

const numberOfPaths = (dfa : DFA, paths : Matrix) => {
    const startIndex = dfa.s
    let result = 0
    for (var terminalIndex of dfa.terminals) {
        result += paths[startIndex][terminalIndex]
        result %= HUGE_PRIME
    }

    return result
}

const prettifyDFA = (dfa : DFA) : DFA => {
    const indexMap = DFAMapIndex(dfa)
    const prettyDFA : DFA = {
        s : ""+indexMap[dfa.s], 
        terminals : new Set([...dfa.terminals].map(uglyState => ""+indexMap[uglyState])),
        transitions : {}
    }

    for (var uglyState in dfa.transitions) {
        const prettyState = indexMap[uglyState]
        prettyDFA.transitions[prettyState] = {
        }

        if (indexMap[dfa.transitions[uglyState].a] !== undefined) {
            prettyDFA.transitions[prettyState].a= ""+indexMap[dfa.transitions[uglyState].a]
        }
        if (indexMap[dfa.transitions[uglyState].b] !== undefined) {
            prettyDFA.transitions[prettyState].b = ""+indexMap[dfa.transitions[uglyState].b]
        }
    }
    return prettyDFA
}

const countStrings = (regex: string, L: number) => {
    const tree = generateTree(regex)
    const nfa = createNFA(tree)
    //printNFA(nfa) //Uncomment to print NFA
    let dfa = NFAtoDFA(nfa)
    dfa = minifyDFA(dfa)
    dfa = prettifyDFA(dfa)
    // printDFA(dfa) // Uncomment to print DFA
    const walkMatrix = createWalkMatrix(dfa)
    const pathMatrix = matrixPower(walkMatrix, L)
    return numberOfPaths(dfa, pathMatrix)
}