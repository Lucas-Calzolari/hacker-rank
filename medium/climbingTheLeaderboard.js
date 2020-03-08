// https://www.hackerrank.com/challenges/climbing-the-leaderboard/problem

const binarySearch = (list, value) => {
    var left = 0;
    var right = list.length-1;

    while ((right - left) > 1) {
        const middle = Math.floor((right-left)/2) + left;
        const middleValue = list[middle];
        if (middleValue > value) {
            left = middle;
        } else {
            right = middle;
        }
    }

    const rightValue = list[right]
    const leftValue = list[left]

    if (rightValue > value) {
        return right + 1;
    }

    if (rightValue == value) { 
        return right;
    }

    if (list[left] < value) {
        return left-1;
    }

    if (leftValue == value) { 
        return left;
    }

    return left+1;
}

const getDenseRank = (scores) => {
    var previousValue = undefined;
    var densePosition = 0;
    const results = [];
    for (var i in scores) {
        const currentValue = scores[i]
        if (previousValue != currentValue) {
            previousValue = currentValue;
            densePosition++;
        }

        results.push(densePosition);
    }
    results.push(densePosition+1);
    return results
}
function climbingLeaderboard(scores, alice) {
    const results = [];
    const denseRank = getDenseRank(scores)
    // console.log(denseRank)
    for (var i in alice) {
        var aliceScore = alice[i];
        const absolutePosition = binarySearch(scores, aliceScore); 
        // console.log({absolutePosition})
        const densePosition = (absolutePosition > 0) ? denseRank[absolutePosition] : 1;
        results.push(densePosition)
    }

    return results;
}

var scores = "100 100 50 40 40 20 10".split(" ").map(s => parseInt(s))
var alice = "5 25 50 120".split(" ").map(s => parseInt(s))
// console.log({scores,alice})
const results = climbingLeaderboard(scores, alice)

console.log(results)