// https://www.hackerrank.com/challenges/non-divisible-subset/problem


function nonDivisibleSubset(k, values) {
    const map = {}
    for (var i in values) {
        const value = values[i] % k;
        if (map[value] === undefined) {
            map[value] = 1;
        } else {
            map[value] += 1
        }
    }

    var total = 0;

    for (var key in map) {
        const current = parseInt(key)
        const complement = k - current

        const currentValue = map[current]
        const complementValue = map[complement]

        const isComplementUndefined = complementValue === undefined;
        const isCurrentValueGreater = currentValue > complementValue
        const isSameValue = currentValue == complementValue
        const isCurrentSmaller = current <= complement
        if (
            isComplementUndefined || 
            isCurrentValueGreater ||
            (isSameValue && isCurrentSmaller) ) {
            if ((current == k/2) || (current == 0)) {
                total += 1;
            } else {
                total += currentValue
            }
        }
    }
    return total
}

var set = "278 576 496 727 410 124 338 149 209 702 282 718 771 575 436".split(" ").map(s => parseInt(s))
set = [1, 1, 1, 12]
var k = 3
const result = nonDivisibleSubset(k, set)
console.log(result);