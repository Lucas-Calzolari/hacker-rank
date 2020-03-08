// https://www.hackerrank.com/challenges/organizing-containers-of-balls/problem
function organizingContainers(container) {
    const size = container.length
    const rows = new Array(size)
    const cols = new Array(size)
    for (var i = 0; i < size; i++) {
        var col = 0;
        var row = 0;    
        for (var j = 0; j < size; j++) {
            row += container[i][j]
            col += container[j][i]
        }
        rows[i] = row
        cols[i] = col
    }

    rows.sort()
    cols.sort()
    
    for (var index in rows) {
        if (rows[index] != cols[index]) {
            return "Impossible"
        }
    }

    return "Possible"
}