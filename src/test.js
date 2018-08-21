/*
 * File: c:\enail-magic\src\test.ts
 * Project: c:\enail-magic
 * Created Date: Tuesday August 21st 2018
 * Author: J-Cat
 * -----
 * Last Modified:
 * Modified By:
 * -----
 * License:
 *    This work is licensed under a Creative Commons Attribution-NonCommercial 4.0
 *    International License (http://creativecommons.org/licenses/by-nc/4.0/).
 * -----
 * Copyright (c) 2018
 */
var drawBitmap = function (data, xPos, yPos) {
    var s = '';
    for (var pos = 0; pos < 32; pos++) {
        for (var c = 0; c < 8; c++) {
            var v = data[pos]
            console.log(v);
            if (((v >> (7 - c)) & 0b1) === 0b1) {
                s += 'X';
            }
            else {
                s += ' ';
            }
        }
        if (pos % 2 === 1) {
            s += '\n';
        }
    }
    console.log(s);
};
var homeIcon = new Uint8Array([
    0b00000111, 0b11100000,
    0b00001111, 0b11110000,
    0b00011111, 0b11111000,
    0b00111111, 0b11111100,
    0b01111111, 0b11111110,
    0b11111111, 0b11111111,
    0b11000000, 0b00000011,
    0b11000000, 0b00000011,
    0b11000000, 0b00000011,
    0b11001111, 0b11110011,
    0b11001111, 0b11110011,
    0b11001100, 0b00110011,
    0b11001100, 0b00110011,
    0b11001100, 0b00110011,
    0b11111100, 0b00111111,
    0b11111100, 0b00111111,
]);
drawBitmap(homeIcon, 0, 0);
