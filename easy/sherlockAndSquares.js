// https://www.hackerrank.com/challenges/sherlock-and-squares/problem

function processData(input) {
    var i;
    var array = _input.split("\n");
    
    var squares = [];
    var max = 1;
    var j = 0;
    while (max < 10e9) {
        squares[j] = Math.pow(j, 2);
         max = squares[j];
         j++;
    }
    
    
    for (i = 1; i < array.length; i++) {        
        var limits = array[i].split(" ");
        var A = limits[0];
        var B = limits[1];
        
        console.log(Math.floor(Math.pow(B, 0.5)) - Math.ceil(Math.pow(A, 0.5)) + 1);
    }
} 